import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, Role } from "../lib/generated/prisma/client";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Plaintext passwords for LOCAL DEV/TESTING ONLY. Never seed real
// credentials this way in a shared or production environment.
const DEV_PASSWORD = "password123";

async function main() {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);

  // --- Users -----------------------------------------------------------
  const admin = await prisma.user.upsert({
    where: { email: "admin@ftsm.ukm.edu.my" },
    update: {},
    create: {
      email: "admin@ftsm.ukm.edu.my",
      name: "Admin FTSM",
      staffNo: "A0001",
      passwordHash,
    },
  });

  const facultyOfficer = await prisma.user.upsert({
    where: { email: "officer@ftsm.ukm.edu.my" },
    update: {},
    create: {
      email: "officer@ftsm.ukm.edu.my",
      name: "Pegawai Akademik FTSM",
      staffNo: "A0002",
      passwordHash,
    },
  });

  const programmeCoordinator = await prisma.user.upsert({
    where: { email: "pcoord@ftsm.ukm.edu.my" },
    update: {},
    create: {
      email: "pcoord@ftsm.ukm.edu.my",
      name: "Dr. Programme Coordinator",
      staffNo: "A0003",
      passwordHash,
    },
  });

  const courseCoordinator = await prisma.user.upsert({
    where: { email: "ccoord@ftsm.ukm.edu.my" },
    update: {},
    create: {
      email: "ccoord@ftsm.ukm.edu.my",
      name: "Dr. Course Coordinator",
      staffNo: "A0004",
      passwordHash,
    },
  });

  // --- Programme ---------------------------------------------------------
  const programme = await prisma.programme.upsert({
    where: { code: "STC" },
    update: {},
    create: {
      code: "STC",
      nameMs: "Sarjana Muda Sains Komputer",
      nameEn: "Bachelor of Computer Science",
    },
  });

  // --- Programme PLOs (placeholder text — replace with real wording from
  // FTSM's curriculum document once available; Table 4 itself only
  // references PLO1..PLO11 by number, it doesn't define them) --------
  for (let n = 1; n <= 11; n++) {
    await prisma.programmePlo.upsert({
      where: {
        programmeId_orderNumber: { programmeId: programme.id, orderNumber: n },
      },
      update: {},
      create: {
        programmeId: programme.id,
        orderNumber: n,
        textMs: `PLO${n}: [Teks penuh belum tersedia \u2014 rujuk dokumen kurikulum program]`,
        textEn: `PLO${n}: [Full text not yet available \u2014 refer to programme curriculum document]`,
      },
    });
  }

  // --- Courses -------------------------------------------------------
  // Add more courses here any time — just add an entry to this list and
  // re-run `npx prisma db seed`. Existing rows (matched by `code`) are
  // left untouched; only new codes get created. Set `coordinatorEmail`
  // to one of the users seeded above, or leave it unset if nobody is
  // assigned yet.
  const COURSES: Array<{
    code: string;
    nameMs: string;
    nameEn?: string;
    creditHours: number;
    coordinatorEmail?: string;
  }> = [
    {
      code: "TTTB1024",
      nameMs: "Pengaturcaraan Berstruktur",
      nameEn: "Structured Programming",
      creditHours: 3.0,
      coordinatorEmail: courseCoordinator.email,
    },
    {
      code: "TTTX6124",
      nameMs: "Keselamatan Rangkaian",
      nameEn: "Network Security",
      creditHours: 4.0,
      coordinatorEmail: courseCoordinator.email,
    },
    // {
    //   code: "TTTB2114",
    //   nameMs: "Struktur Data",
    //   nameEn: "Data Structures",
    //   creditHours: 3.0,
    //   coordinatorEmail: courseCoordinator.email,
    // },
  ];

  for (const c of COURSES) {
    const course = await prisma.course.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        nameMs: c.nameMs,
        nameEn: c.nameEn,
        creditHours: c.creditHours,
        programmeId: programme.id,
      },
    });

    if (c.coordinatorEmail) {
      const coordinator = await prisma.user.findUniqueOrThrow({
        where: { email: c.coordinatorEmail },
      });
      await prisma.courseAssignment.upsert({
        where: {
          courseId_userId: { courseId: course.id, userId: coordinator.id },
        },
        update: { isCoordinator: true },
        create: {
          courseId: course.id,
          userId: coordinator.id,
          isCoordinator: true,
        },
      });
    }
  }

  // --- Sample fully-filled Table 4 draft (TTTX6124 / Network Security)
  // — real content transcribed from the sample .xlsm K provided, so
  // there's a complete draft to test the PDF/Word export against. Only
  // created once (checks for an existing v1 first) — safe to re-run.
  {
    const sampleCourse = await prisma.course.findUniqueOrThrow({
      where: { code: "TTTX6124" },
    });

    const existingSampleVersion = await prisma.proformaVersion.findUnique({
      where: { courseId_versionNo: { courseId: sampleCourse.id, versionNo: 1 } },
    });

    if (!existingSampleVersion) {
      const version = await prisma.proformaVersion.create({
        data: {
          courseId: sampleCourse.id,
          versionNo: 1,
          status: "DRAFT",
          createdById: courseCoordinator.id,
          synopsis:
            "Kursus ini meliputi topik asas dan pertengahan dalam keselamatan rangkaian. Matlamat kursus ini adalah untuk menyediakan pelajar dengan konsep dan pengetahuan menggunakan protokol dan aplikasi keselamatan rangkaian untuk memberi keselamatan ke atas rangkaian dan Internet. Topik-topik merangkumi keselamatan aras-pengangkutan, keselamatan rangkaian tanpa wayar, keselamatan mel elektronik, keselamatan IP dan keselamatan pengurusan rangkaian.\nThis course covers the basic and intermediate topics in network security. The aim of this course is to prepare students with the concept and knowledge of using network security protocols and applications to provide security over networks and the Internet. Topics covered include the low level frame packet analysis, analyze each layer in TCP/IP protocol, network security design, email security, web security, wireless security, and honeypot.",
          academicStaffNames: ["Khairul Azmi Abu Bakar", "Nazhatul Hafizah Kamarudin"],
          yearOffered: 1,
          semesterOffered: 1,
          offeringRemarks: "Ditawarkan pada setiap semester",
          prerequisite: "Tiada",
          classification: "TERAS",
          transferableSkills: ["Kemahiran Kognitif", "Kemahiran Digital"],
          specialRequirements:
            "Software: Wireshark, Vmware, Python; Hardware: Wireless Access Point, Wireless Adapter USB Card",
          referencesText:
            "Cunningham, JR. 2023. The Defenders Handbook to Zero Trust. New York: McGraw-Hill.\nEdwards, Jason. 2024. Crafting Cybersecurity: A Comprehensive Guide to Penetration Testing. New York: Apress.\nGilman, Evan and Doug Barth. 2023. Zero Trust Networks (2nd Edition). Sebastopol: O'Reilly Media.\nSantos, Omar, Ron Taylor, dan Joseph Mlodzianowski. 2024. CompTIA Security+ SY0-701 Cert Guide (2nd Edition). Indianapolis: Pearson.\nWilson, Mark and Darren Mackey. 2023. Security Program and Policies (3rd Edition). New York: Pearson.",
          futureReadyElements: [
            "Elemen 2: Pembelajaran Transformatif dan Penyampaian Pengajaran",
          ],
          excelFramework: ["IDEAL (Industry Driven Experiential Learning)"],
          sdgTags: [
            "SDG4: Quality Education/Pendidikan Berkualiti",
            "SDG17: Partnerships for the Goals/Rakan Kerjasama untuk Matlamat",
          ],
          aiElement: false,
          isIndustrialTraining50Elt: false,
          facultyApprovalDate: new Date("2022-07-22"),
          senateApprovalDate: new Date("2022-07-22"),
        },
      });

      // CLOs, with the exact PLO mapping / teaching-assessment methods /
      // MQF cluster from the sample.
      const cloData = [
        {
          text:
            "Menganalisis keperluan keselamatan bagi menyediakan komunikasi selamat melalui rangkaian\nAnalyse the security requirements for providing secure communication over the network",
          teachingMethods: "Tutorial/Tutoran",
          assessmentMethods: "Final Exam/Peperiksaan Akhir",
          mqfClusters: ["C2"],
          ploNumber: 2,
        },
        {
          text:
            "Mengenalpasti teknologi rangkaian terkini dan cabaran dalam keselamatan rangkaian\nIdentify current network technologies and their challenges in network security",
          teachingMethods: "Tutorial/Tutoran",
          assessmentMethods: "Essay/Esei",
          mqfClusters: ["C2"],
          ploNumber: 6,
        },
        {
          text:
            "Merungkai insiden keselamatan rangkaian menggunakan alatan tertentu\nRecognise the network security incidents using specific tools",
          teachingMethods: "Demonstration/Demonstrasi",
          assessmentMethods: "Practical Report/Laporan Amali",
          mqfClusters: ["C3A"],
          ploNumber: 3,
        },
        {
          text: "Mewajarkan rangkaian yang selamat.\nJustify a secured network.",
          teachingMethods: "Tutorial/Tutoran",
          assessmentMethods: "Final Exam/Peperiksaan Akhir",
          mqfClusters: ["C3D"],
          ploNumber: 2,
        },
      ];

      const createdClos = [];
      for (let i = 0; i < cloData.length; i++) {
        const c = cloData[i];
        const clo = await prisma.courseLearningOutcome.create({
          data: {
            versionId: version.id,
            orderIndex: i + 1,
            text: c.text,
            teachingMethods: c.teachingMethods,
            assessmentMethods: c.assessmentMethods,
            mqfClusters: c.mqfClusters,
          },
        });
        createdClos.push(clo);

        const plo = await prisma.programmePlo.findUniqueOrThrow({
          where: {
            programmeId_orderNumber: {
              programmeId: programme.id,
              orderNumber: c.ploNumber,
            },
          },
        });
        await prisma.cloPloMapping.create({
          data: { cloId: clo.id, programmePloId: plo.id },
        });
      }

      // Weekly topics — hours are (physical F2F, independent) pairs;
      // this sample has no F2F-online hours recorded.
      const topicData: [string, number, number, number][] = [
        ["Overview of Network Security / Gambaran mengenai Keselamatan Rangkaian", 1, 2, 4],
        ["Introduction to Wireshark / Pengenalan ke Wireshark", 3, 4, 5],
        ["Packet Capture Analysis / Analisis Tangkapan Paket", 3, 5, 7],
        ["Weakness in Existing Protocol and Deep Web / Kekangan Protokol Sedia Ada dan Web Dalam", 2, 2, 4],
        ["Electronic Mail Security / Keselamatan Mel Elektronik", 1, 2, 4],
        ["Mail Server Vulnerabilities / Kelemahan Pelayan Mel", 2, 2, 4],
        ["Web Application Security / Keselamatan Aplikasi Web", 2, 1, 2],
        ["Intruders, Malware and Current Issues / Penceroboh, Perisian Hasad dan Isu Semasa", 2, 2, 4],
        ["Existing Network Security Technologies / Teknologi Keselamatan Rangkaian Sedia Ada", 2, 5, 7],
        ["Wireless Sniffing and WEP Cracking / Penghiduan Tanpa Wayar dan Retak WEP", 3, 2, 4],
        ["Honeypot / Honeypot", 1, 5, 7],
        ["Implementation of Honeypot / Pelaksanaan Honeypot", 3, 6, 9],
        ["Network Security Design / Reka Bentuk Keselamatan Rangkaian", 4, 2, 4],
      ];

      for (let i = 0; i < topicData.length; i++) {
        const [topic, cloNum, physical, independent] = topicData[i];
        // "Implementation of Honeypot" is hands-on practical work — file
        // its physical hours under P (Practical) rather than L (Lecture).
        const isPractical = topic.startsWith("Implementation of Honeypot");
        await prisma.courseTopic.create({
          data: {
            versionId: version.id,
            orderIndex: i + 1,
            topicMs: topic,
            cloRef: `CLO${cloNum}`,
            hours: {
              f2fPhysical: isPractical
                ? { l: 0, t: 0, p: physical, o: 0 }
                : { l: physical, t: 0, p: 0, o: 0 },
              f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
              independent,
            },
          },
        });
      }

      // Continuous assessment.
      await prisma.assessmentItem.create({
        data: {
          versionId: version.id,
          phase: "CONTINUOUS",
          orderIndex: 1,
          nameMs: "Esei",
          nameEn: "Essay",
          weightagePercent: "30",
          hours: {
            f2fPhysical: { l: 0, t: 0, p: 0, o: 0 },
            f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
            independent: 21,
          },
        },
      });
      await prisma.assessmentItem.create({
        data: {
          versionId: version.id,
          phase: "CONTINUOUS",
          orderIndex: 2,
          nameMs: "Laporan Amali",
          nameEn: "Practical Report",
          weightagePercent: "30",
          hours: {
            f2fPhysical: { l: 0, t: 0, p: 0, o: 0 },
            f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
            independent: 22,
          },
        },
      });

      // Final assessment.
      await prisma.assessmentItem.create({
        data: {
          versionId: version.id,
          phase: "FINAL",
          orderIndex: 1,
          nameMs: "Peperiksaan Akhir",
          nameEn: "Final Exam",
          weightagePercent: "40",
          hours: {
            f2fPhysical: { l: 3, t: 0, p: 0, o: 0 },
            f2fOnline: { l: 0, t: 0, p: 0, o: 0 },
            independent: 9,
          },
        },
      });

      console.log(
        `Draf sampel TTTX6124 dicipta (${createdClos.length} CLO, ${topicData.length} topik).`
      );
    }
  }

  // --- Roles ---------------------------------------------------------
  // Faculty-wide roles (no programmeId): compound unique keys don't play
  // nicely with `undefined`/`null` in upsert's `where`, so use a plain
  // findFirst + create instead of upsert here.
  const existingAdminRole = await prisma.userRole.findFirst({
    where: { userId: admin.id, role: Role.ADMIN, programmeId: null },
  });
  if (!existingAdminRole) {
    await prisma.userRole.create({
      data: { userId: admin.id, role: Role.ADMIN },
    });
  }

  const existingOfficerRole = await prisma.userRole.findFirst({
    where: {
      userId: facultyOfficer.id,
      role: Role.FACULTY_OFFICER,
      programmeId: null,
    },
  });
  if (!existingOfficerRole) {
    await prisma.userRole.create({
      data: { userId: facultyOfficer.id, role: Role.FACULTY_OFFICER },
    });
  }

  // Programme-scoped role.
  await prisma.userRole.upsert({
    where: {
      userId_role_programmeId: {
        userId: programmeCoordinator.id,
        role: Role.PROGRAMME_COORDINATOR,
        programmeId: programme.id,
      },
    },
    update: {},
    create: {
      userId: programmeCoordinator.id,
      role: Role.PROGRAMME_COORDINATOR,
      programmeId: programme.id,
    },
  });

  await prisma.userRole.upsert({
    where: {
      userId_role_programmeId: {
        userId: courseCoordinator.id,
        role: Role.COURSE_COORDINATOR,
        programmeId: programme.id,
      },
    },
    update: {},
    create: {
      userId: courseCoordinator.id,
      role: Role.COURSE_COORDINATOR,
      programmeId: programme.id,
    },
  });

  console.log("Seed selesai:");
  console.log({
    programme: programme.code,
    plos: "PLO1-PLO11 (placeholder)",
    courses: COURSES.map((c) => c.code),
    users: [admin.email, facultyOfficer.email, programmeCoordinator.email, courseCoordinator.email],
    devPassword: DEV_PASSWORD,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
