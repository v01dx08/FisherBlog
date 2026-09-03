const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const { createHash } = require("node:crypto");

const prisma = new PrismaClient();

async function main() {
  const adminPlainPassword = process.env.ADMIN_PASSWORD || "Admin12345!";
  const influencerPlainPassword = process.env.DEMO_USER_PASSWORD || "Influencer123!";
  if (process.env.NODE_ENV === "production" && !process.env.ADMIN_PASSWORD) {
    throw new Error("ADMIN_PASSWORD is required when seeding production");
  }
  const adminPassword = await bcrypt.hash(adminPlainPassword, 12);
  const userPassword = await bcrypt.hash(influencerPlainPassword, 12);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {
      username: "admin",
      usernameNormalized: "admin",
      email: "admin@fishviet.vn",
      emailNormalized: "admin@fishviet.vn",
      password: adminPassword,
      role: "ADMIN",
      displayName: "Ban Quản Trị FishViet",
      bio: "Tài khoản quản trị chính thức của FishViet. Kiểm duyệt nội dung và hỗ trợ bảo vệ quyền tác giả của nhà sáng tạo.",
      isProfileCompleted: true,
    },
    create: {
      username: "admin",
      usernameNormalized: "admin",
      email: "admin@fishviet.vn",
      emailNormalized: "admin@fishviet.vn",
      password: adminPassword,
      role: "ADMIN",
      displayName: "Ban Quản Trị FishViet",
      bio: "Tài khoản quản trị chính thức của FishViet. Kiểm duyệt nội dung và hỗ trợ bảo vệ quyền tác giả của nhà sáng tạo.",
      isProfileCompleted: true,
    },
  });

  const influencersData = [
    {
      username: "MinhDucFishing",
      email: "minhduc@fishviet.vn",
      password: userPassword,
      role: "INFLUENCER",
      displayName: "Minh Đức Fishing",
      bio: "Đam mê săn cá săn mồi hồ Trị An và sông Đồng Nai. Chia sẻ kinh nghiệm câu lure và các điểm câu hoang sơ.",
      location: "Đồng Nai, Việt Nam",
      fishingStyle: "Lure cá Chẽm, Lóc bông",
      youtubeUrl: "https://youtube.com/@minhducfishing",
      tiktokUrl: "https://tiktok.com/@minhduc_angler",
      facebookUrl: "https://facebook.com/minhduc.fishing",
      isProfileCompleted: true,
      posts: [
        {
          content:
            "Album tổng kết chuyến săn cá Lóc bông và cá Chẽm khủng 2 ngày 1 đêm tại lòng hồ Trị An. Trọn vẹn từ lúc hạ trại lúc hoàng hôn, chuẩn bị mồi thìa, kéo cá lên bè cho tới bữa tiệc nướng dã ngoại cùng anh em cần thủ.\n\nAnh em bấm vào từng ảnh để xem chi tiết độ cong của cần nhé!\n\n#albumcâucá #hồTrịAn #cálócbông #cáchẽm #dãngoại",
          imageUrl: JSON.stringify([
            "https://picsum.photos/seed/trian-album-1/1200/800",
            "https://picsum.photos/seed/trian-album-2/800/800",
            "https://picsum.photos/seed/trian-album-3/800/800",
            "https://picsum.photos/seed/trian-album-4/800/800",
            "https://picsum.photos/seed/trian-album-5/800/800",
            "https://picsum.photos/seed/trian-album-6/800/800",
          ]),
          videoUrl: null,
          species: "Cá Lóc bông & Cá Chẽm",
          weightKg: 5.8,
          spotName: "Lòng hồ Trị An",
          publications: [
            { platform: "YOUTUBE", url: "https://youtube.com/watch?v=fishviet-trian-album" },
            { platform: "FACEBOOK", url: "https://facebook.com/minhduc.fishing/posts/fishviet-demo" },
          ],
          comments: [
            "Bố cục album ảnh nhìn chuyên nghiệp như Facebook vậy anh Đức!",
            "Nhìn ảnh số 3 kéo cần cong vút phê thật sự!",
          ],
        },
        {
          content:
            "Sáng nay đi câu ở hồ Trị An, trúng con cá Chẽm hơn 3kg sau gần 20 phút vật lộn! Dùng mồi giả dạng tôm kéo chậm sát đáy, cú cắn mạnh không tưởng. Cảm giác cần cong vút và dây rít lên thật sự đã tay anh em ạ.\n\n#câucá #hồTrịAn #cáchẽm #mồigiả #nhậtkýcâucá",
          imageUrl: "https://picsum.photos/seed/lake-catch-1/800/600",
          videoUrl: null,
          species: "Cá Chẽm",
          weightKg: 3.2,
          spotName: "Hồ Trị An",
          publications: [
            { platform: "TIKTOK", url: "https://tiktok.com/@minhduc_angler/video/7500000000000000000" },
          ],
          comments: [
            "Con chẽm này nhìn đẫy đà quá anh Đức ơi!",
            "Anh kéo mồi tôm chì nặng mấy gram thế anh?",
            "Chúc mừng anh, hồ Trị An dạo này nước trong dễ cắn mồi ghê.",
          ],
        },
        {
          content:
            "Đoạn clip ngắn ghi lại khoảnh khắc cá táp mồi trên mặt nước lúc 6h sáng tại đập tràn Trị An. Nước bắn tung tóe, tim đập thình thịch!\n\n#khoảnhkhắc #câulure #topwater #hồTrịAn",
          imageUrl: null,
          videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
          species: "Cá Lóc",
          spotName: "Đập tràn Trị An",
          publications: [],
          comments: [
            "Cú táp mồi dứt khoát quá bác!",
          ],
        },
      ],
    },
    {
      username: "HoangAnhAngler",
      email: "hoanganh@fishviet.vn",
      password: userPassword,
      role: "INFLUENCER",
      displayName: "Hoàng Anh Angler",
      bio: "Chuyên gia đồ câu biển và shore jigging. Review thiết bị câu chính xác, trung thực cho anh em cần thủ.",
      location: "Bà Rịa - Vũng Tàu",
      fishingStyle: "Shore Jigging, Câu ghềnh",
      youtubeUrl: "https://youtube.com/@hoanganhangler",
      tiktokUrl: "https://tiktok.com/@hoanganh.fishing",
      facebookUrl: "https://facebook.com/hoanganh.angler",
      isProfileCompleted: true,
      posts: [
        {
          content:
            "Review nhanh bộ cần Shimano Dialuna S96M vừa tậu. Độ nhạy cực kỳ tốt, cảm nhận được từng cú chạm nhẹ của cá dưới đáy. Cân bằng hoàn hảo khi quăng xa, không bị mỏi tay dù câu cả buổi. Anh em nào đang tìm cần shore jigging tầm trung thì đây là lựa chọn rất đáng cân nhắc.\n\n#shimano #reviewđồcâu #shorejigging #vũngtàu",
          imageUrl: "https://picsum.photos/seed/fishing-rod-review/800/500",
          videoUrl: null,
          spotName: "Bãi Sau Vũng Tàu",
          publications: [
            { platform: "YOUTUBE", url: "https://youtube.com/watch?v=fishviet-dialuna-review" },
          ],
          comments: [
            "Cần này tải mồi max bao nhiêu gram vậy bác?",
            "Đang định xúc em này, xem review của bác yên tâm chốt luôn!",
          ],
        },
      ],
    },
    {
      username: "TruongGiangFly",
      email: "truonggiang@fishviet.vn",
      password: userPassword,
      role: "INFLUENCER",
      displayName: "Trường Giang Fly",
      bio: "Nghệ thuật câu ruồi (Fly fishing) giữa thiên nhiên đại ngàn Tây Nguyên. Hãy tôn trọng thiên nhiên và thả cá về dòng nước.",
      location: "Lâm Đồng, Việt Nam",
      fishingStyle: "Fly Fishing (Câu ruồi)",
      youtubeUrl: "https://youtube.com/@truonggiangfly",
      tiktokUrl: "https://tiktok.com/@giang.flyfisher",
      facebookUrl: "https://facebook.com/truonggiang.fly",
      isProfileCompleted: true,
      posts: [
        {
          content:
            "Chuyến fly fishing ở suối Đạ Nhim, Lâm Đồng thật sự mê hoặc. Bắt được 4 con cá Hồi Vân trước bình minh. Sương mù phủ trên mặt nước, tiếng suối chảy róc rách, không gì sánh bằng cảm giác này.\n\nAnh em nào muốn đi chung chuyến sau inbox mình nhé!\n\n#flyfishing #cáhồivân #đànhim #câucámiềnnúi",
          imageUrl: "https://picsum.photos/seed/fly-stream-mist/800/500",
          videoUrl: null,
          species: "Cá Hồi Vân",
          weightKg: 1.6,
          spotName: "Suối Đạ Nhim",
          publications: [],
          comments: [
            "Cảnh đẹp mê hồn! Suối này nước trong vắt luôn bác Giang ạ.",
          ],
        },
      ],
    },
    {
      username: "ThuHaFishing",
      email: "thuha@fishviet.vn",
      password: userPassword,
      role: "INFLUENCER",
      displayName: "Thu Hà Fishing Girl",
      bio: "Nữ cần thủ yêu biển và những chuyến đi câu đêm ngoài khơi. Đam mê không phân biệt giới tính!",
      location: "TP. Hồ Chí Minh",
      fishingStyle: "Câu biển, Câu đêm",
      youtubeUrl: "https://youtube.com/@thuthafihsing",
      tiktokUrl: "https://tiktok.com/@thuha.angler",
      facebookUrl: "https://facebook.com/thuha.fishing",
      isProfileCompleted: true,
      posts: [
        {
          content:
            "Kỷ lục cá nhân mới! Cá Bông Lau 4.2kg câu được ngoài cửa biển Cần Giờ. Sử dụng mồi sống với lưỡi vòng tròn, thả trôi theo dòng nước. Bí quyết là tìm đúng luồng nước nơi cá đang đi kiếm ăn. Kiên nhẫn thực sự mang lại kết quả xứng đáng!\n\n#câubiển #cábônglau #cầngiờ #kỷlụccánhân #nhậtkýcâucá",
          imageUrl: "https://picsum.photos/seed/sea-night-catch/800/600",
          videoUrl: null,
          species: "Cá Bông Lau",
          weightKg: 4.2,
          spotName: "Cửa biển Cần Giờ",
          publications: [
            { platform: "INSTAGRAM", url: "https://instagram.com/p/fishviet-cangio-demo" },
          ],
          comments: [
            "Đỉnh chóp bạn Hà ơi, bông lau khủng thật sự!",
            "Nhìn con cá đã mắt quá, phục tài câu đêm của bạn.",
          ],
        },
      ],
    },
    {
      username: "ThanhTungKayak",
      email: "thanhtung@fishviet.vn",
      password: userPassword,
      role: "INFLUENCER",
      displayName: "Thanh Tùng Kayak",
      bio: "Kết hợp chèo thuyền kayak và câu cá trên các lòng hồ lớn miền Bắc. Khám phá vẻ đẹp nguyên sơ của thiên nhiên.",
      location: "Bắc Kạn, Việt Nam",
      fishingStyle: "Kayak Fishing, Lure nước ngọt",
      youtubeUrl: "https://youtube.com/@thanhtungkayak",
      tiktokUrl: "https://tiktok.com/@tung.kayakfishing",
      facebookUrl: "https://facebook.com/tungkayak",
      isProfileCompleted: true,
      posts: [
        {
          content:
            "Một ngày chèo thuyền Kayak câu cá trên hồ Ba Bể. Nước xanh ngọc bích phẳng lặng như gương. Buổi chiều kéo được 2 em cá Mương to và 1 em Ngựa chấm tuyệt đẹp.\n\n#hồBaBể #kayakfishing #thiênnhiên #câulure",
          imageUrl: "https://picsum.photos/seed/kayak-lake-babe/800/600",
          videoUrl: null,
          species: "Cá Ngựa chấm",
          weightKg: 1.1,
          spotName: "Hồ Ba Bể",
          publications: [],
          comments: [
            "Lên Ba Bể câu kayak thì chuẩn bài nghỉ dưỡng rồi bác Tùng!",
          ],
        },
      ],
    },
    {
      username: "TanThuAngler",
      email: "tanthu@fishviet.vn",
      password: userPassword,
      role: "INFLUENCER",
      displayName: "Tân Thủ Cần Cẩu",
      bio: null,
      location: null,
      fishingStyle: null,
      isProfileCompleted: false, // Testing onboarding
      posts: [],
    },
  ];

  const createdPosts = [];

  for (const inf of influencersData) {
    const user = await prisma.user.upsert({
      where: { username: inf.username },
      update: {
        username: inf.username,
        usernameNormalized: inf.username.toLowerCase(),
        email: inf.email,
        emailNormalized: inf.email.toLowerCase(),
        password: inf.password,
        displayName: inf.displayName,
        bio: inf.bio,
        location: inf.location,
        fishingStyle: inf.fishingStyle,
        youtubeUrl: inf.youtubeUrl,
        tiktokUrl: inf.tiktokUrl,
        facebookUrl: inf.facebookUrl,
        isProfileCompleted: inf.isProfileCompleted,
      },
      create: {
        username: inf.username,
        usernameNormalized: inf.username.toLowerCase(),
        email: inf.email,
        emailNormalized: inf.email.toLowerCase(),
        password: inf.password,
        role: inf.role,
        displayName: inf.displayName,
        bio: inf.bio,
        location: inf.location,
        fishingStyle: inf.fishingStyle,
        youtubeUrl: inf.youtubeUrl,
        tiktokUrl: inf.tiktokUrl,
        facebookUrl: inf.facebookUrl,
        isProfileCompleted: inf.isProfileCompleted,
      },
    });

    for (const post of inf.posts) {
      let existingPost = await prisma.post.findFirst({
        where: {
          authorId: user.id,
          content: post.content,
        },
      });

      if (!existingPost) {
        existingPost = await prisma.post.create({
          data: {
            content: post.content,
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            species: post.species || null,
            weightKg: post.weightKg || null,
            spotName: post.spotName || null,
            authorId: user.id,
            proofHash: createHash("sha256")
              .update(`${user.id}:${post.content}:${post.imageUrl || ""}:${post.videoUrl || ""}`)
              .digest("hex"),
          },
        });
      } else {
        existingPost = await prisma.post.update({
          where: { id: existingPost.id },
          data: {
            imageUrl: post.imageUrl,
            videoUrl: post.videoUrl,
            species: post.species || null,
            weightKg: post.weightKg || null,
            spotName: post.spotName || null,
          },
        });
      }

      createdPosts.push(existingPost);

      for (const publication of post.publications || []) {
        await prisma.postPublication.upsert({
          where: { postId_url: { postId: existingPost.id, url: publication.url } },
          update: {
            platform: publication.platform,
            publishedAt: publication.publishedAt ? new Date(publication.publishedAt) : null,
          },
          create: {
            postId: existingPost.id,
            platform: publication.platform,
            url: publication.url,
            publishedAt: publication.publishedAt ? new Date(publication.publishedAt) : null,
          },
        });
      }

      if (post.comments && post.comments.length > 0) {
        for (const comm of post.comments) {
          const existingComm = await prisma.comment.findFirst({
            where: {
              postId: existingPost.id,
              content: comm,
            },
          });
          if (!existingComm) {
            await prisma.comment.create({
              data: {
                content: comm,
                postId: existingPost.id,
                authorId: admin.id,
              },
            });
          }
        }
      }
    }
  }

  // Seed initial Likes and Bookmarks for admin
  if (createdPosts.length > 0) {
    for (let i = 0; i < Math.min(3, createdPosts.length); i++) {
      const p = createdPosts[i];
      await prisma.like.upsert({
        where: { postId_userId: { postId: p.id, userId: admin.id } },
        update: {},
        create: { postId: p.id, userId: admin.id },
      });

      if (i === 0) {
        await prisma.bookmark.upsert({
          where: { postId_userId: { postId: p.id, userId: admin.id } },
          update: {},
          create: { postId: p.id, userId: admin.id },
        });
      }
    }
  }

  // Seed Follow relationships between users
  const allUsers = await prisma.user.findMany({ select: { id: true, username: true } });
  const userMap = {};
  for (const u of allUsers) userMap[u.username] = u.id;

  const followPairs = [
    ["admin", "MinhDucFishing"],
    ["admin", "ThuHaFishing"],
    ["MinhDucFishing", "HoangAnhAngler"],
    ["MinhDucFishing", "TruongGiangFly"],
    ["HoangAnhAngler", "MinhDucFishing"],
    ["ThuHaFishing", "MinhDucFishing"],
    ["ThuHaFishing", "ThanhTungKayak"],
    ["TruongGiangFly", "ThanhTungKayak"],
    ["ThanhTungKayak", "TruongGiangFly"],
  ];

  for (const [follower, following] of followPairs) {
    if (userMap[follower] && userMap[following]) {
      await prisma.follow.upsert({
        where: {
          followerId_followingId: {
            followerId: userMap[follower],
            followingId: userMap[following],
          },
        },
        update: {},
        create: {
          followerId: userMap[follower],
          followingId: userMap[following],
        },
      });
    }
  }

  // Seed Notifications for admin
  if (userMap["MinhDucFishing"] && createdPosts.length > 0) {
    const notifData = [
      {
        userId: admin.id,
        type: "like",
        actorId: userMap["MinhDucFishing"],
        postId: createdPosts[0]?.id,
        content: "Minh Đức Fishing đã thả tim nhật ký của bạn.",
        isRead: false,
      },
      {
        userId: admin.id,
        type: "comment",
        actorId: userMap["ThuHaFishing"],
        postId: createdPosts[0]?.id,
        content: "Thu Hà Fishing Girl đã bình luận: 'Hồ Trị An dạo này nước trong dễ cắn mồi ghê.'",
        isRead: false,
      },
      {
        userId: admin.id,
        type: "follow",
        actorId: userMap["HoangAnhAngler"],
        content: "Hoàng Anh Angler đã bắt đầu theo dõi bạn.",
        isRead: false,
      },
      {
        userId: admin.id,
        type: "system",
        content: "Bản gốc của bạn đã được FishViet ghi dấu SHA-256 thành công.",
        isRead: true,
      },
    ];

    for (const n of notifData) {
      const existingNotification = await prisma.notification.findFirst({
        where: {
          userId: n.userId,
          type: n.type,
          actorId: n.actorId || null,
          postId: n.postId || null,
          content: n.content,
        },
      });
      if (!existingNotification) {
        await prisma.notification.create({ data: n });
      }
    }
  }

  // Seed Conversations + Messages
  const convPairs = [
    {
      userA: "admin",
      userB: "MinhDucFishing",
      messages: [
        { sender: "MinhDucFishing", content: "Chào anh, đợt này hồ Trị An nước rất trong, anh định đi ngày nào?" },
        { sender: "MinhDucFishing", content: "Kéo mồi tôm giả sát đáy bảo đảm cá chẽm táp liền tay." },
        { sender: "admin", content: "Cuối tuần này mình có thời gian, hẹn gặp anh ở bến thuyền nhé!" },
      ],
    },
    {
      userA: "admin",
      userB: "ThuHaFishing",
      messages: [
        { sender: "ThuHaFishing", content: "Cuối tuần này mình có chuyến câu đêm Cần Giờ, nhóm mình còn 2 chỗ nhé!" },
        { sender: "admin", content: "Nghe hay quá! Mình tham gia, hẹn giờ đi nhé Thu Hà." },
      ],
    },
  ];

  for (const pair of convPairs) {
    if (!userMap[pair.userA] || !userMap[pair.userB]) continue;

    // Check if conversation already exists
    const existingParticipantsA = await prisma.conversationParticipant.findMany({
      where: { userId: userMap[pair.userA] },
      select: { conversationId: true },
    });
    const existingParticipantsB = await prisma.conversationParticipant.findMany({
      where: { userId: userMap[pair.userB] },
      select: { conversationId: true },
    });

    const aConvIds = new Set(existingParticipantsA.map((p) => p.conversationId));
    const sharedConvId = existingParticipantsB.find((p) => aConvIds.has(p.conversationId))?.conversationId;

    let convId = sharedConvId;
    if (!convId) {
      const conv = await prisma.conversation.create({
        data: {
          participants: {
            create: [
              { userId: userMap[pair.userA] },
              { userId: userMap[pair.userB] },
            ],
          },
        },
      });
      convId = conv.id;
    }

    // Check if messages already exist
    const existingMsgCount = await prisma.message.count({ where: { conversationId: convId } });
    if (existingMsgCount === 0) {
      for (const msg of pair.messages) {
        await prisma.message.create({
          data: {
            conversationId: convId,
            senderId: userMap[msg.sender],
            content: msg.content,
            isRead: true,
          },
        });
      }
    }

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });
  }

  console.log("Database seeded successfully with posts, comments, likes, bookmarks, follows, notifications, conversations and messages.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("Seed error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
