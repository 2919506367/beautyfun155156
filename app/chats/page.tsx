import Link from "next/link";
import { redirect } from "next/navigation";
import PrivateChatRealtime from "@/components/PrivateChatRealtime";
import GroupChatRealtime from "@/components/GroupChatRealtime";
import UserIdentity from "@/components/UserIdentity";
import ChatConversationList from "@/components/ChatConversationList";
import SessionStatusGuard from "@/components/SessionStatusGuard";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type SearchParams = Promise<{
  kind?: string;
  id?: string;
}>;

function getInitials(name: string) {
  const text = String(name || "").trim();
  if (!text) return "聊";
  return text.slice(0, 2);
}

function buildGroupAvatarSeed(name: string) {
  const text = String(name || "").trim();
  if (!text) return "群";
  return text.slice(0, 2);
}

export default async function ChatsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  const params = await searchParams;
  const selectedKind =
    params.kind === "group" || params.kind === "private" ? params.kind : "";
  const selectedId = Number(params.id || "0");

  const [friendships, groups] = await Promise.all([
    prisma.friendship.findMany({
      where: {
        OR: [{ user1Id: currentUser.id }, { user2Id: currentUser.id }],
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        user1: {
          select: {
            id: true,
            nickname: true,
            account: true,
            avatarUrl: true,
            role: true,
            xp: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
            account: true,
            avatarUrl: true,
            role: true,
            xp: true,
          },
        },
      },
    }),
    prisma.groupChat.findMany({
      where: {
        members: {
          some: {
            userId: currentUser.id,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: {
          select: {
            members: true,
          },
        },
      },
    }),
  ]);

  const friends = friendships.map((item) =>
    item.user1.id === currentUser.id ? item.user2 : item.user1,
  );

  const privateConversations = await Promise.all(
    friends.map(async (friend) => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.privateMessage.findFirst({
          where: {
            OR: [
              {
                fromUserId: currentUser.id,
                toUserId: friend.id,
              },
              {
                fromUserId: friend.id,
                toUserId: currentUser.id,
              },
            ],
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            content: true,
            createdAt: true,
            isDeleted: true,
          },
        }),
        prisma.privateMessage.count({
          where: {
            fromUserId: friend.id,
            toUserId: currentUser.id,
            readAt: null,
          },
        }),
      ]);

      return {
        kind: "private" as const,
        id: friend.id,
        title: friend.nickname,
        subtitle: `账号：${friend.account}`,
        avatarUrl: friend.avatarUrl,
        avatarFallback: getInitials(friend.nickname),
        preview: lastMessage ? lastMessage.content : "还没有聊天记录",
        updatedAt: lastMessage?.createdAt
          ? lastMessage.createdAt.toISOString()
          : null,
        unreadCount,
      };
    }),
  );

  const groupConversations = await Promise.all(
    groups.map(async (group) => {
      const [lastMessage, unreadCount] = await Promise.all([
        prisma.groupMessage.findFirst({
          where: {
            groupId: group.id,
          },
          orderBy: {
            createdAt: "desc",
          },
          select: {
            content: true,
            createdAt: true,
            sender: {
              select: {
                nickname: true,
              },
            },
          },
        }),
        prisma.groupMessage.count({
          where: {
            groupId: group.id,
            senderId: {
              not: currentUser.id,
            },
            readAt: null,
          },
        }),
      ]);

      return {
        kind: "group" as const,
        id: group.id,
        title: group.name,
        subtitle: `${group._count.members} 位成员`,
        avatarUrl: null as string | null,
        avatarFallback: buildGroupAvatarSeed(group.name),
        preview: lastMessage?.content?.trim()
          ? `${lastMessage.sender.nickname}：${lastMessage.content}`
          : "还没有群消息",
        updatedAt: lastMessage?.createdAt
          ? lastMessage.createdAt.toISOString()
          : group.createdAt.toISOString(),
        unreadCount,
      };
    }),
  );

  const conversations: {
    kind: "private" | "group";
    id: number;
    title: string;
    subtitle: string;
    avatarUrl: string | null;
    avatarFallback?: string;
    preview: string;
    updatedAt: string | null;
    unreadCount: number;
  }[] = [...privateConversations, ...groupConversations];

  const activeConversation =
    selectedKind && selectedId
      ? conversations.find(
          (item) => item.kind === selectedKind && item.id === selectedId,
        ) || null
      : conversations[0] || null;

  let rightPane: React.ReactNode = (
    <div className="chat-empty-pane">
      <div className="chat-empty-pane-glow" />

      <div className="chat-empty-chip-row">
        <span className="chat-empty-chip">消息中心</span>
        <span className="chat-empty-chip">Private / Group</span>
        <span className="chat-empty-chip">Liquid Glass</span>
      </div>

      <div className="chat-empty-title">选择一个会话</div>

      <div className="chat-empty-text">
        左侧支持搜索、置顶、仅未读筛选和最近活跃排序。右侧聊天窗口支持搜索消息、回复、转发、编辑和删除自己的消息。
      </div>

      <div className="chat-empty-feature-grid">
        <div className="chat-empty-feature-card">
          <div className="chat-empty-feature-title">会话管理</div>
          <div className="chat-empty-feature-text">
            置顶、筛选未读、保留最近活跃排序。
          </div>
        </div>

        <div className="chat-empty-feature-card">
          <div className="chat-empty-feature-title">消息操作</div>
          <div className="chat-empty-feature-text">
            右键可回复、转发，群聊还支持编辑和删除。
          </div>
        </div>

        <div className="chat-empty-feature-card">
          <div className="chat-empty-feature-title">输入体验</div>
          <div className="chat-empty-feature-text">
            草稿自动保存，Enter 发送，Shift + Enter 换行。
          </div>
        </div>
      </div>
    </div>
  );

  const forwardTargets = [
    ...friends.map((friend) => ({
      kind: "private" as const,
      id: friend.id,
      title: friend.nickname,
      subtitle: `账号：${friend.account}`,
    })),
    ...groups.map((group) => ({
      kind: "group" as const,
      id: group.id,
      title: group.name,
      subtitle: `${group._count.members} 位成员`,
    })),
  ];

  if (activeConversation?.kind === "private") {
    const targetUser = await prisma.user.findUnique({
      where: { id: activeConversation.id },
      select: {
        id: true,
        nickname: true,
        account: true,
        avatarUrl: true,
        role: true,
        xp: true,
      },
    });

    if (targetUser) {
      const messages = await prisma.privateMessage.findMany({
        where: {
          OR: [
            {
              fromUserId: currentUser.id,
              toUserId: targetUser.id,
            },
            {
              fromUserId: targetUser.id,
              toUserId: currentUser.id,
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
        select: {
          id: true,
          fromUserId: true,
          toUserId: true,
          content: true,
          createdAt: true,
          readAt: true,
          editedAt: true,
          isDeleted: true,
          mentionText: true,
          emoticon: {
            select: {
              id: true,
              label: true,
              imageUrl: true,
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
              fromUserId: true,
              emoticon: {
                select: {
                  id: true,
                  label: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
      });

      rightPane = (
        <div className="chat-pane">
          <div className="chat-pane-head">
            <div className="chat-pane-head-left">
              {targetUser.avatarUrl ? (
                <img
                  src={targetUser.avatarUrl}
                  alt={targetUser.nickname}
                  className="chat-pane-avatar"
                />
              ) : (
                <div className="chat-pane-avatar-fallback chat-pane-avatar-fallback-user">
                  {getInitials(targetUser.nickname)}
                </div>
              )}

              <div>
                <div style={{ marginBottom: 4 }}>
                  <UserIdentity
                    userId={targetUser.id}
                    nickname={targetUser.nickname}
                    role={targetUser.role}
                    xp={targetUser.xp}
                  />
                </div>
                <div className="chat-pane-subtitle">
                  账号：{targetUser.account}
                </div>
              </div>
            </div>

            <div className="chat-pane-head-actions">
              <div className="chat-pane-status-pill">私聊会话</div>
              <div className="chat-pane-status-pill">实时同步</div>

              <Link
                href={`/users/${targetUser.id}`}
                className="chat-pane-head-btn"
              >
                查看资料
              </Link>
            </div>
          </div>

          <PrivateChatRealtime
            targetUserId={targetUser.id}
            targetUserName={targetUser.nickname}
            currentUserId={currentUser.id}
            initialMessages={messages.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
              readAt: item.readAt ? item.readAt.toISOString() : null,
              editedAt: item.editedAt ? item.editedAt.toISOString() : null,
            }))}
            forwardTargets={forwardTargets}
          />
        </div>
      );
    }
  }

  if (activeConversation?.kind === "group") {
    const group = await prisma.groupChat.findUnique({
      where: { id: activeConversation.id },
      select: {
        id: true,
        name: true,
        createdAt: true,
        members: {
          select: {
            id: true,
            user: {
              select: {
                id: true,
                nickname: true,
                role: true,
                xp: true,
              },
            },
          },
        },
        messages: {
          orderBy: {
            createdAt: "asc",
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
            senderId: true,
            readAt: true,
            editedAt: true,
            isDeleted: true,
            mentionText: true,
            emoticon: {
              select: {
                id: true,
                label: true,
                imageUrl: true,
              },
            },
            sender: {
              select: {
                id: true,
                nickname: true,
                role: true,
                xp: true,
              },
            },
            replyTo: {
              select: {
                id: true,
                content: true,
                emoticon: {
                  select: {
                    id: true,
                    label: true,
                    imageUrl: true,
                  },
                },
                sender: {
                  select: {
                    nickname: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (group) {
      rightPane = (
        <div className="chat-pane">
          <div className="chat-pane-head">
            <div className="chat-pane-head-left">
              <div className="chat-pane-avatar-fallback chat-pane-avatar-fallback-group">
                {buildGroupAvatarSeed(group.name)}
              </div>

              <div>
                <div className="chat-pane-group-title">{group.name}</div>
                <div className="chat-pane-subtitle">
                  {group.members.length} 位成员　/　创建于{" "}
                  {new Date(group.createdAt).toLocaleString()}
                </div>
              </div>
            </div>

            <div className="chat-pane-member-row chat-pane-member-row-clean">
              <div className="chat-pane-status-pill">群聊会话</div>
              <div className="chat-pane-status-pill">
                {group.members.length} 位成员
              </div>
              <div className="chat-pane-status-pill chat-pane-status-muted">
                实时同步
              </div>
            </div>
          </div>

          <GroupChatRealtime
            groupId={group.id}
            currentUserId={currentUser.id}
            initialMessages={group.messages.map((item) => ({
              ...item,
              createdAt: item.createdAt.toISOString(),
              readAt: item.readAt ? item.readAt.toISOString() : null,
              editedAt: item.editedAt ? item.editedAt.toISOString() : null,
            }))}
            mentionCandidates={group.members.map((item) => ({
              id: item.user.id,
              nickname: item.user.nickname,
            }))}
            forwardTargets={forwardTargets}
          />
        </div>
      );
    }
  }

  return (
    <div className="telegram-chat-page-frame">
      <SessionStatusGuard />

      <nav className="telegram-chat-site-nav" aria-label="BeautyFun 主导航">
        <div className="telegram-chat-site-nav-brand">
          <span className="telegram-chat-site-nav-dot" />
          <div>
            <div className="telegram-chat-site-nav-kicker">BEAUTYFUN OS</div>
            <div className="telegram-chat-site-nav-title">主导航</div>
          </div>
        </div>

        <div className="telegram-chat-site-nav-section">浏览分区</div>
        <Link href="/" className="telegram-chat-site-nav-link">
          <span>🖼️</span>
          <strong>图集区</strong>
        </Link>
        <Link href="/gifs" className="telegram-chat-site-nav-link">
          <span>🎞️</span>
          <strong>动图区</strong>
        </Link>
        <Link href="/videos" className="telegram-chat-site-nav-link">
          <span>📺</span>
          <strong>视频区</strong>
        </Link>
        <Link href="/forum" className="telegram-chat-site-nav-link">
          <span>📰</span>
          <strong>论坛社区</strong>
        </Link>

        <div className="telegram-chat-site-nav-section">个人功能</div>
        <Link href="/favorites" className="telegram-chat-site-nav-link">
          <span>⭐</span>
          <strong>我的收藏</strong>
        </Link>
        <Link href="/history" className="telegram-chat-site-nav-link">
          <span>🕘</span>
          <strong>观看历史</strong>
        </Link>
        <Link href="/upload" className="telegram-chat-site-nav-link">
          <span>⬆️</span>
          <strong>上传作品</strong>
        </Link>
        <Link href="/profile" className="telegram-chat-site-nav-link">
          <span>👤</span>
          <strong>个人资料</strong>
        </Link>
      </nav>

      <div className="telegram-chat-app">
        <aside className="telegram-chat-sidebar">
          <div className="telegram-chat-sidebar-top">
            <Link
              href="/"
              className="telegram-chat-menu-btn"
              aria-label="返回首页"
            >
              ☰
            </Link>
            <div className="telegram-chat-app-title">
              <div className="telegram-chat-title-main">BeautyFun</div>
              <div className="telegram-chat-title-sub">消息中心</div>
            </div>
            <Link
              href="/profile"
              className="telegram-chat-menu-btn"
              aria-label="个人资料"
            >
              👤
            </Link>
          </div>

          <ChatConversationList
            currentUserId={currentUser.id}
            conversations={conversations}
            activeKind={activeConversation?.kind || ""}
            activeId={activeConversation?.id || 0}
          />
        </aside>

        <main className="telegram-chat-main">{rightPane}</main>
      </div>
    </div>
  );
}
