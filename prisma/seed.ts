import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PW = "demo1234";

async function main() {
  console.log("🌱 Seeding Sportplex...");

  // 초기화
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.message.deleteMany();
  await prisma.chatRoom.deleteMany();
  await prisma.review.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.recruitment.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.commentLike.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.career.deleteMany();
  await prisma.verificationRequest.deleteMany();
  await prisma.newsItem.deleteMany();
  await prisma.user.deleteMany();

  const hash = await bcrypt.hash(PW, 10);

  const coachKim = await prisma.user.create({
    data: {
      email: "coach.kim@demo.com",
      password: hash,
      name: "김도훈 코치",
      nickname: "도훈코치",
      points: 310,
      role: "COACH",
      sport: "농구",
      region: "서울 강남구",
      bio: "15년 경력 농구 코치입니다. 기초 드리블부터 실전 전술까지 눈높이 지도해요. 🏀",
      verified: true,
    },
  });

  const teacherPark = await prisma.user.create({
    data: {
      email: "teacher.park@demo.com",
      password: hash,
      name: "박서연 선생님",
      nickname: "수영러서연",
      points: 180,
      role: "TEACHER",
      sport: "수영",
      region: "서울 송파구",
      bio: "생활체육 수영 지도자. 물공포 극복 전문! 어린이·성인 모두 환영합니다. 🏊",
      verified: true,
    },
  });

  const directorChoi = await prisma.user.create({
    data: {
      email: "director.choi@demo.com",
      password: hash,
      name: "최강현 감독",
      nickname: "강현감독",
      points: 720,
      role: "DIRECTOR",
      sport: "축구",
      region: "경기 성남시",
      bio: "前 프로 유스팀 감독. 엘리트 선수 진로 상담 및 포지션별 트레이닝. ⚽",
      verified: true,
    },
  });

  const parentLee = await prisma.user.create({
    data: {
      email: "parent.lee@demo.com",
      password: hash,
      name: "이수진",
      nickname: "수진맘",
      points: 15,
      role: "PARENT",
      region: "서울 강남구",
      bio: "초등 4학년 아이 엄마예요. 아이에게 맞는 좋은 코치를 찾고 있어요!",
    },
  });

  const studentJung = await prisma.user.create({
    data: {
      email: "student.jung@demo.com",
      password: hash,
      name: "정민재",
      nickname: "테니스민재",
      points: 45,
      role: "STUDENT",
      sport: "테니스",
      region: "서울 마포구",
      bio: "고2 테니스 입문자입니다. 주말 레슨 구해요!",
    },
  });

  // 관리자 계정
  const admin = await prisma.user.create({
    data: {
      email: "admin@sportplex.com",
      password: hash,
      name: "스포렉스 관리자",
      role: "COACH",
      isAdmin: true,
      bio: "Sportplex 운영팀",
    },
  });

  // 미인증 지도자 (인증 심사 대기 데모용)
  const coachHan = await prisma.user.create({
    data: {
      email: "coach.han@demo.com",
      password: hash,
      name: "한지민 코치",
      nickname: "지민코치",
      points: 5,
      role: "COACH",
      sport: "테니스",
      region: "서울 마포구",
      bio: "테니스 입문·주니어 전문 코치입니다. 🎾",
      verified: false,
    },
  });
  await prisma.verificationRequest.create({
    data: {
      userId: coachHan.id,
      realName: "한지민",
      credential: "생활스포츠지도사 2급(테니스), OO테니스아카데미 주니어반 코치 4년. 첨부한 자격증 사진 확인 부탁드립니다.",
      status: "PENDING",
    },
  });

  // 경력
  await prisma.career.createMany({
    data: [
      { userId: coachKim.id, title: "OO고등학교 농구부 코치", org: "OO고등학교", startYear: 2018, detail: "전국대회 8강 지도" },
      { userId: coachKim.id, title: "유소년 농구 클럽 강사", org: "강남 점프업 클럽", startYear: 2012, endYear: 2018 },
      { userId: coachKim.id, title: "대학 농구 선수", org: "한국체대", startYear: 2008, endYear: 2012 },
      { userId: teacherPark.id, title: "수영 강사 (마스터즈)", org: "송파 스포츠센터", startYear: 2016, detail: "성인 생존수영 클래스 운영" },
      { userId: teacherPark.id, title: "생활스포츠지도사 2급", org: "문화체육관광부", startYear: 2015, endYear: 2015 },
      { userId: directorChoi.id, title: "프로 유스 U-15 감독", org: "성남FC 유스", startYear: 2014, endYear: 2021 },
      { userId: directorChoi.id, title: "K리그 선수", org: "프로축구단", startYear: 2003, endYear: 2013 },
    ],
  });

  // 뉴스 (홈 스포츠 이슈)
  await prisma.newsItem.createMany({
    data: [
      { sport: "축구", title: "손흥민, 시즌 20호골 폭발… 팀 우승 경쟁 견인", summary: "유럽 무대에서 다시 한 번 결정적인 활약을 펼치며 득점 선두에 올랐다.", source: "스포츠플렉스" },
      { sport: "농구", title: "KBL 플레이오프 대진 확정, 1위 팀의 독주는 계속될까", summary: "정규시즌 막바지 순위 경쟁이 치열하게 전개되고 있다.", source: "스포츠플렉스" },
      { sport: "야구", title: "신인 투수 데뷔전 7이닝 무실점 호투", summary: "강속구와 변화구의 완급 조절로 타선을 완벽히 봉쇄했다.", source: "스포츠플렉스" },
      { sport: "테니스", title: "국내 주니어, 국제대회 16강 진출 쾌거", summary: "강서브를 앞세워 세계 랭커를 상대로 값진 승리를 거뒀다.", source: "스포츠플렉스" },
      { sport: "수영", title: "자유형 100m 한국新… 파리 이후 세대교체 신호탄", summary: "젊은 선수들의 기록 경신이 잇따르고 있다.", source: "스포츠플렉스" },
      { sport: "배구", title: "여자배구 V리그, 막판 봄배구 티켓 경쟁 후끈", summary: "5위 싸움이 시즌 끝까지 이어질 전망이다.", source: "스포츠플렉스" },
      { sport: "골프", title: "20대 신예, 생애 첫 투어 우승 감격의 눈물", summary: "최종일 버디 행진으로 역전 우승을 차지했다.", source: "스포츠플렉스" },
      { sport: "태권도", title: "그랑프리 시리즈, 한국 종주국 자존심 지켰다", summary: "체급별 금메달을 휩쓸며 종합 1위에 올랐다.", source: "스포츠플렉스" },
    ],
  });

  // 커뮤니티 글
  const post1 = await prisma.post.create({
    data: {
      authorId: parentLee.id,
      category: "QUESTION",
      sport: "농구",
      title: "초등 4학년 농구 처음 시작하는데 키 작아도 괜찮을까요?",
      content: "아이가 농구에 관심이 많은데 또래보다 키가 작은 편이에요. 지금 시작해도 늦지 않을지, 어떤 점을 중점적으로 봐야 할지 조언 부탁드려요!",
      views: 42,
    },
  });
  const post2 = await prisma.post.create({
    data: {
      authorId: studentJung.id,
      category: "QUESTION",
      sport: "테니스",
      title: "테니스 라켓 입문용 추천 부탁드립니다",
      content: "고등학생 입문자입니다. 예산 15만원 정도로 무난한 라켓 추천 부탁드려요. 백핸드가 약한 편입니다.",
      views: 31,
    },
  });
  const postFree = await prisma.post.create({
    data: {
      authorId: studentJung.id,
      category: "FREE",
      title: "다들 운동 끝나고 뭐 드세요? 🍗",
      content: "훈련 끝나고 단백질 보충 뭘로 하시는지 궁금해요! 닭가슴살은 이제 질려서…",
      views: 88,
    },
  });
  const postInfo = await prisma.post.create({
    data: {
      authorId: directorChoi.id,
      category: "INFO",
      sport: "축구",
      title: "[정보] 부상 예방을 위한 동적 스트레칭 루틴 공유",
      content: "경기 전 5분 동적 스트레칭 루틴을 정리했습니다. 햄스트링·고관절 위주로…",
      views: 153,
    },
  });
  const postTeam = await prisma.post.create({
    data: {
      authorId: coachHan.id,
      category: "TEAMUP",
      sport: "테니스",
      title: "주말 마포 테니스 같이 치실 분 구해요 🎾",
      content: "토요일 오전 망원 코트에서 랠리 연습 같이 하실 분! 초중급 환영합니다.",
      views: 64,
    },
  });

  await prisma.comment.createMany({
    data: [
      { postId: post1.id, authorId: coachKim.id, content: "전혀 늦지 않았습니다! 이 시기엔 키보다 기본기와 운동 흥미가 훨씬 중요해요. 드리블·민첩성 위주로 시작하면 좋습니다." },
      { postId: post1.id, authorId: parentLee.id, content: "코치님 답변 감사합니다! 상담 한번 받아보고 싶네요 :)" },
      { postId: post2.id, authorId: directorChoi.id, content: "입문용은 가벼운 라켓이 부상 위험이 적습니다. 매장에서 직접 그립감 확인해보시길 추천드려요." },
      { postId: postFree.id, authorId: teacherPark.id, content: "전 연어랑 고구마요! 가끔 그릭요거트도 좋아요 😋" },
      { postId: postInfo.id, authorId: coachKim.id, content: "정성스러운 정보 감사합니다. 저희 팀에도 공유할게요!" },
    ],
  });

  // 좋아요 (인기글 → HOT 뱃지)
  await prisma.postLike.createMany({
    data: [
      { postId: postInfo.id, userId: coachKim.id },
      { postId: postInfo.id, userId: teacherPark.id },
      { postId: postInfo.id, userId: parentLee.id },
      { postId: postInfo.id, userId: studentJung.id },
      { postId: postFree.id, userId: coachKim.id },
      { postId: postFree.id, userId: teacherPark.id },
      { postId: postFree.id, userId: coachHan.id },
      { postId: postTeam.id, userId: studentJung.id },
    ],
  });

  // 답글(대댓글) + 댓글 좋아요 데모
  const rootComment = await prisma.comment.create({
    data: { postId: postFree.id, authorId: coachKim.id, content: "닭가슴살 질릴 땐 두부면도 추천해요! 간단하고 단백질도 충분합니다 💪" },
  });
  await prisma.comment.createMany({
    data: [
      { postId: postFree.id, parentId: rootComment.id, authorId: studentJung.id, content: "오 두부면 좋네요! 어디서 사세요?" },
      { postId: postFree.id, parentId: rootComment.id, authorId: coachKim.id, content: "@테니스민재 마트나 온라인에 많아요~ 한 봉에 천원대!" },
    ],
  });
  await prisma.commentLike.createMany({
    data: [
      { commentId: rootComment.id, userId: studentJung.id },
      { commentId: rootComment.id, userId: teacherPark.id },
      { commentId: rootComment.id, userId: parentLee.id },
    ],
  });

  // 샘플 신고 (관리자 처리 데모용)
  await prisma.report.create({
    data: {
      reporterId: parentLee.id,
      targetType: "POST",
      targetId: postFree.id,
      reason: "스팸/광고",
      detail: "글 내용과 관련 없는 광고성으로 의심됩니다.",
    },
  });

  // 모집공고
  const recruit1 = await prisma.recruitment.create({
    data: {
      authorId: parentLee.id,
      sport: "농구",
      serviceType: "LESSON",
      title: "초4 아들 농구 기초 레슨 코치님 구해요 (강남)",
      content: "주 1~2회, 주말 오전 위주로 기초부터 차근차근 가르쳐주실 코치님 찾습니다. 강남 인근 체육관에서 진행 희망해요.",
      region: "서울 강남구",
      budget: "회당 5만원 (협의 가능)",
      status: "OPEN",
    },
  });

  await prisma.recruitment.create({
    data: {
      authorId: studentJung.id,
      sport: "테니스",
      serviceType: "LESSON",
      title: "주말 테니스 레슨 선생님 찾습니다 (마포)",
      content: "테니스 입문 고등학생입니다. 토요일 오후에 2시간씩 포핸드/백핸드 기초 잡아주실 분 구해요.",
      region: "서울 마포구",
      budget: "협의",
      status: "OPEN",
    },
  });

  await prisma.recruitment.create({
    data: {
      authorId: parentLee.id,
      sport: "축구",
      serviceType: "COUNSELING",
      title: "아이 축구 엘리트 진로 상담 받고 싶어요",
      content: "초6 아이가 축구 선수를 꿈꾸는데, 엘리트 진로로 가는 게 맞을지 전문가 상담을 받아보고 싶습니다.",
      region: "온라인 가능",
      budget: "상담료 협의",
      status: "OPEN",
    },
  });

  // 제안 (코치가 모집공고1에 제안)
  await prisma.proposal.create({
    data: {
      recruitmentId: recruit1.id,
      proposerId: coachKim.id,
      message: "안녕하세요, 15년 경력 농구 코치 김도훈입니다. 초등 저학년 기초 지도 경험이 많습니다. 강남 체육관 대관 가능하고, 주말 오전 일정 조율 가능합니다. 첫 수업은 체험으로 진행해드려요!",
      price: "회당 5만원",
      status: "PENDING",
    },
  });

  // ── 과거 완료된 매칭 + 상호 후기 (성사된 경우에만 후기 가능) ──
  // 1) 학부모 이수진 ↔ 수영 박서연 선생님
  const doneSwim = await prisma.recruitment.create({
    data: {
      authorId: parentLee.id,
      sport: "수영",
      serviceType: "LESSON",
      title: "아이 수영 기초 레슨 (완료)",
      content: "물공포가 있던 아이 수영 입문 레슨을 받았습니다.",
      region: "서울 송파구",
      budget: "회당 4만원",
      status: "MATCHED",
    },
  });
  const propSwim = await prisma.proposal.create({
    data: {
      recruitmentId: doneSwim.id,
      proposerId: teacherPark.id,
      message: "물공포 극복 프로그램으로 차근차근 진행하겠습니다!",
      price: "회당 4만원",
      status: "ACCEPTED",
    },
  });
  await prisma.review.createMany({
    data: [
      { proposalId: propSwim.id, authorId: parentLee.id, targetId: teacherPark.id, rating: 5, content: "물을 무서워하던 아이가 3주 만에 자유형을 했어요. 정말 친절하시고 아이 눈높이에 맞춰주셔서 감사합니다!" },
      { proposalId: propSwim.id, authorId: teacherPark.id, targetId: parentLee.id, rating: 5, content: "아이도 잘 따라와 주고 어머님도 적극적으로 협조해주셔서 수업이 즐거웠습니다 :)" },
    ],
  });

  // 2) 학생 정민재 ↔ 농구 김도훈 코치
  const doneBall = await prisma.recruitment.create({
    data: {
      authorId: studentJung.id,
      sport: "농구",
      serviceType: "LESSON",
      title: "농구 슛폼 교정 레슨 (완료)",
      content: "슛폼 교정과 드리블 기초를 배웠습니다.",
      region: "서울 강남구",
      budget: "회당 5만원",
      status: "MATCHED",
    },
  });
  const propBall = await prisma.proposal.create({
    data: {
      recruitmentId: doneBall.id,
      proposerId: coachKim.id,
      message: "슛폼부터 탄탄히 잡아드리겠습니다.",
      price: "회당 5만원",
      status: "ACCEPTED",
    },
  });
  await prisma.review.createMany({
    data: [
      { proposalId: propBall.id, authorId: studentJung.id, targetId: coachKim.id, rating: 5, content: "슛 자세를 완전히 바꿔주셨어요. 한 달 만에 자유투 성공률이 확 올랐습니다. 강추!" },
      { proposalId: propBall.id, authorId: coachKim.id, targetId: studentJung.id, rating: 4, content: "성실하게 잘 따라와 줬어요. 앞으로가 더 기대되는 학생입니다." },
    ],
  });

  // 채팅방 + 메시지 (학부모 ↔ 코치)
  const [a, b] = parentLee.id < coachKim.id ? [parentLee.id, coachKim.id] : [coachKim.id, parentLee.id];
  const room = await prisma.chatRoom.create({ data: { userAId: a, userBId: b } });
  await prisma.message.create({ data: { roomId: room.id, senderId: parentLee.id, content: "코치님 안녕하세요! 제안 잘 봤어요. 혹시 이번 주 토요일 오전에 체험수업 가능할까요?" } });
  await prisma.message.create({ data: { roomId: room.id, senderId: coachKim.id, content: "네 안녕하세요 어머님! 토요일 오전 10시 가능합니다 😊 강남구 OO체육관에서 진행하면 될까요?" } });
  await prisma.message.create({ data: { roomId: room.id, senderId: parentLee.id, content: "좋아요! 그럼 그때 뵐게요. 준비물 있을까요?" } });

  // ── 추천(채택) + 포인트 데모: 수진맘이 도훈코치의 답변을 추천 ──
  const kimAnswer = await prisma.comment.findFirst({
    where: { postId: post1.id, authorId: coachKim.id },
  });
  if (kimAnswer) {
    await prisma.comment.update({ where: { id: kimAnswer.id }, data: { recommended: true } });
    await prisma.user.update({ where: { id: coachKim.id }, data: { points: { increment: 10 } } });
  }

  // ── 알림 데모 ──
  await prisma.notification.createMany({
    data: [
      { userId: coachKim.id, actorId: parentLee.id, type: "RECOMMEND", message: "수진맘님이 회원님의 답변을 추천했어요! (+10P)", link: `/board/${post1.id}` },
      { userId: parentLee.id, actorId: coachKim.id, type: "PROPOSAL", message: '도훈코치님이 "초4 아들 농구 기초 레슨 코치님 구해요" 공고에 제안을 보냈어요.', link: `/recruit/${recruit1.id}` },
      { userId: parentLee.id, actorId: coachKim.id, type: "COMMENT", message: "도훈코치님이 회원님의 글에 댓글을 남겼어요.", link: `/board/${post1.id}` },
      { userId: studentJung.id, actorId: teacherPark.id, type: "COMMENT_LIKE", message: "수영러서연님이 회원님의 댓글을 좋아합니다.", link: `/board/${postFree.id}` },
    ],
  });

  console.log("✅ Seed 완료!");
  console.log("   데모 로그인: coach.kim@demo.com / parent.lee@demo.com (비번: demo1234)");
  console.log("   관리자: admin@sportplex.com (비번: demo1234) → /admin");
  console.log("   인증 대기: coach.han@demo.com 의 신청이 심사 대기중");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
