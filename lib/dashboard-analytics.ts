export type LatestCourseStatus =
  | "DRAFT"
  | "SUBMITTED"
  | "CHANGES_REQUESTED"
  | "APPROVED"
  | "PUBLISHED"
  | "SUPERSEDED"
  | "ARCHIVED"
  | null;

export type CourseAnalyticsInput = {
  latestStatus: LatestCourseStatus;
};

export function computeDashboardAnalytics(courses: CourseAnalyticsInput[]) {
  const totalCourses = courses.length;
  const withTable4 = courses.filter((course) => course.latestStatus !== null).length;
  const published = courses.filter((course) => course.latestStatus === "PUBLISHED").length;
  const inReview = courses.filter(
    (course) => course.latestStatus === "SUBMITTED" || course.latestStatus === "APPROVED"
  ).length;
  const changesRequested = courses.filter(
    (course) => course.latestStatus === "CHANGES_REQUESTED"
  ).length;
  const drafts = courses.filter((course) => course.latestStatus === "DRAFT").length;
  const withoutTable4 = totalCourses - withTable4;

  const percentage = (value: number) =>
    totalCourses === 0 ? 0 : Math.round((value / totalCourses) * 100);

  return {
    totalCourses,
    withTable4,
    withoutTable4,
    published,
    inReview,
    changesRequested,
    drafts,
    coveragePercent: percentage(withTable4),
    publishedPercent: percentage(published),
  };
}
