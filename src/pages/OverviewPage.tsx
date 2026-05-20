import { Line } from "@ant-design/charts";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Segmented, Statistic, Typography } from "antd";
import { useState } from "react";

import {
  adminQueryKeys,
  getAdminDailyUserMetrics,
  getAdminUserStatistics,
  getCollectionReports
} from "../shared/api/adminEndpoints";
import type { AdminDailyUserMetricRes, AdminDailyUserMetricsRange } from "../shared/api/adminTypes";

const dailyUserMetricsRangeOptions: { label: string; value: AdminDailyUserMetricsRange }[] = [
  { label: "7일", value: "DAYS_7" },
  { label: "30일", value: "DAYS_30" },
  { label: "전체", value: "ALL" }
];

export function OverviewPage() {
  const [dailyUserMetricsRange, setDailyUserMetricsRange] = useState<AdminDailyUserMetricsRange>("DAYS_30");
  const dailyUserMetricsParams = { range: dailyUserMetricsRange };
  const userStatisticsQuery = useQuery({
    queryKey: adminQueryKeys.userStatistics,
    queryFn: getAdminUserStatistics
  });
  const pendingReportsQuery = useQuery({
    queryKey: adminQueryKeys.collectionReports({ status: "PENDING", page: 1, size: 5 }),
    queryFn: () => getCollectionReports({ status: "PENDING", page: 1, size: 5 })
  });
  const dailyUserMetricsQuery = useQuery({
    queryKey: adminQueryKeys.dailyUserMetrics(dailyUserMetricsParams),
    queryFn: () => getAdminDailyUserMetrics(dailyUserMetricsParams)
  });
  const chartData = toChartData(dailyUserMetricsQuery.data?.dailyMetrics);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>대시보드</Typography.Title>
          <Typography.Paragraph>방문자, 신규 가입, 회원 수 흐름을 한눈에 확인합니다.</Typography.Paragraph>
        </div>
      </header>

      <div className="metric-grid">
        <Card>
          <Statistic
            loading={userStatisticsQuery.isPending}
            title="가입 회원 수"
            value={userStatisticsQuery.data?.activeUserCount ?? 0}
          />
        </Card>
        <Card>
          <Statistic
            loading={pendingReportsQuery.isPending}
            title="처리 대기 신고"
            suffix="건"
            value={pendingReportsQuery.data?.meta.totalElements ?? pendingReportsQuery.data?.meta.returned ?? 0}
          />
        </Card>
      </div>

      <Card
        title="일별 방문자·신규 가입·회원 수"
        extra={
          <Segmented
            aria-label="기간 선택"
            options={dailyUserMetricsRangeOptions}
            value={dailyUserMetricsRange}
            onChange={(value) => setDailyUserMetricsRange(value as AdminDailyUserMetricsRange)}
          />
        }
      >
        {dailyUserMetricsQuery.isError ? (
          <Alert type="error" showIcon message="접속 사용자 그래프를 불러오지 못했습니다." />
        ) : null}
        {dailyUserMetricsQuery.isPending ? (
          <Typography.Text type="secondary">그래프를 불러오는 중입니다.</Typography.Text>
        ) : null}
        {!dailyUserMetricsQuery.isPending && !dailyUserMetricsQuery.isError ? (
          <Line
            data={chartData}
            xField="date"
            yField="value"
            colorField="metric"
            height={320}
            point={{ shapeField: "circle", sizeField: 3 }}
            scale={{ y: { domainMin: 0 } }}
            axis={{ y: { labelFormatter: (value: string) => `${value}명` } }}
            interaction={{ tooltip: { marker: false } }}
            style={{ lineWidth: 2 }}
          />
        ) : null}
      </Card>
    </div>
  );
}

function toChartData(metrics: AdminDailyUserMetricRes[] = []) {
  return metrics.flatMap((metric) => [
    {
      date: metric.date,
      metric: "방문자",
      value: metric.visitorCount
    },
    {
      date: metric.date,
      metric: "신규 가입",
      value: metric.signupUserCount
    },
    {
      date: metric.date,
      metric: "회원 수",
      value: metric.memberCount
    }
  ]);
}
