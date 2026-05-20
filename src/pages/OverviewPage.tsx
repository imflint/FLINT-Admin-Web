import { Line } from "@ant-design/charts";
import { useQuery } from "@tanstack/react-query";
import { Alert, Card, Segmented, Space, Statistic, Typography } from "antd";
import { useState } from "react";

import {
  adminQueryKeys,
  getAdminDailyUserMetrics,
  getAdminUserStatistics,
  getCollectionReports
} from "../shared/api/adminEndpoints";
import type { AdminDailyUserMetricRes, AdminDailyUserMetricsRange } from "../shared/api/adminTypes";

type DailyUserMetricKey = "visitorCount" | "signupUserCount" | "memberCount";

const dailyUserMetricsRangeOptions: { label: string; value: AdminDailyUserMetricsRange }[] = [
  { label: "7일", value: "DAYS_7" },
  { label: "30일", value: "DAYS_30" },
  { label: "전체", value: "ALL" }
];
const dailyUserMetricOptions: { label: string; value: DailyUserMetricKey }[] = [
  { label: "방문자", value: "visitorCount" },
  { label: "신규 가입", value: "signupUserCount" },
  { label: "회원 수", value: "memberCount" }
];

export function OverviewPage() {
  const [dailyUserMetricsRange, setDailyUserMetricsRange] = useState<AdminDailyUserMetricsRange>("DAYS_30");
  const [selectedMetric, setSelectedMetric] = useState<DailyUserMetricKey>("visitorCount");
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
  const selectedMetricLabel = dailyUserMetricOptions.find((option) => option.value === selectedMetric)?.label ?? "방문자";
  const chartData = toChartData(dailyUserMetricsQuery.data?.dailyMetrics, selectedMetric);
  const chartTicks = resolveChartTicks(chartData);
  const chartDomain = resolveChartDomain(chartTicks);

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
        title="일별 사용자 지표"
        extra={
          <Space wrap>
            <Segmented
              aria-label="지표 선택"
              options={dailyUserMetricOptions}
              value={selectedMetric}
              onChange={(value) => setSelectedMetric(value as DailyUserMetricKey)}
            />
            <Segmented
              aria-label="기간 선택"
              options={dailyUserMetricsRangeOptions}
              value={dailyUserMetricsRange}
              onChange={(value) => setDailyUserMetricsRange(value as AdminDailyUserMetricsRange)}
            />
          </Space>
        }
      >
        {dailyUserMetricsQuery.isError ? (
          <Alert type="error" showIcon message="접속 사용자 그래프를 불러오지 못했습니다." />
        ) : null}
        {dailyUserMetricsQuery.isPending ? (
          <Typography.Text type="secondary">그래프를 불러오는 중입니다.</Typography.Text>
        ) : null}
        {!dailyUserMetricsQuery.isPending && !dailyUserMetricsQuery.isError ? (
          <div className="chart-panel">
            <Typography.Title level={3}>{selectedMetricLabel}</Typography.Title>
            <Line
              data={chartData}
              xField="date"
              yField="value"
              height={320}
              shapeField="smooth"
              scale={{ y: { domain: chartDomain, tickMethod: () => chartTicks } }}
              axis={{ y: { labelFormatter: formatCountLabel } }}
              tooltip={{
                title: (item: { date?: string }) => item.date ?? "",
                items: [{ field: "value", name: selectedMetricLabel, valueFormatter: formatCountLabel }]
              }}
              interaction={{ tooltip: { marker: false } }}
              style={{ lineWidth: 2 }}
            />
          </div>
        ) : null}
      </Card>
    </div>
  );
}

function toChartData(metrics: AdminDailyUserMetricRes[] = [], metricKey: DailyUserMetricKey) {
  return metrics.map((metric) => ({
    date: metric.date,
    value: metric[metricKey]
  }));
}

function resolveChartTicks(data: { value: number }[]) {
  const values = data.map((item) => Math.round(item.value));
  const uniqueValues = Array.from(new Set(values)).sort((a, b) => a - b);
  return uniqueValues.length > 0 ? uniqueValues : [0];
}

function resolveChartDomain(ticks: number[]) {
  const minValue = ticks[0] ?? 0;
  const maxValue = ticks[ticks.length - 1] ?? 0;

  if (minValue === maxValue) {
    return minValue === 0 ? [0, 1] : [0, minValue];
  }

  return [minValue, maxValue];
}

function formatCountLabel(value: string | number) {
  return `${Math.round(Number(value))}명`;
}
