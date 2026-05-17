import { useMutation } from "@tanstack/react-query";
import { App as AntApp, Button, Card, DatePicker, Descriptions, Form, Select, Typography } from "antd";
import type { Dayjs } from "dayjs";

import { triggerBatch } from "../shared/api/adminEndpoints";
import type { BatchTriggerReq, BatchType, MediaType } from "../shared/api/adminTypes";

interface BatchFormValues {
  type: BatchType;
  date?: Dayjs;
  mediaType: MediaType;
  startDate?: Dayjs;
  endDate?: Dayjs;
}

export function BatchPage() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<BatchFormValues>();
  const selectedBatchType = Form.useWatch("type", form) ?? "movies";
  const batchMutation = useMutation({
    mutationFn: (values: BatchTriggerReq) => triggerBatch(values),
    onSuccess: () => {
      void message.success("데이터 업데이트를 시작했습니다.");
    }
  });

  const handleFinish = (values: BatchFormValues) => {
    batchMutation.mutate({
      type: values.type,
      date: formatOptionalDate(values.date),
      mediaType: values.mediaType,
      startDate: formatOptionalDate(values.startDate),
      endDate: formatOptionalDate(values.endDate)
    });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>데이터 업데이트</Typography.Title>
          <Typography.Paragraph>영화, TV, OTT 정보를 최신 상태로 갱신합니다. 필요한 항목만 선택해 실행하세요.</Typography.Paragraph>
        </div>
      </header>

      <div className="section-grid">
        <Card title="업데이트할 항목">
          <Form<BatchFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ type: "movies", mediaType: "MOVIE" }}
            onFinish={handleFinish}
          >
            <Form.Item label="작업 종류" name="type" rules={[{ required: true, message: "작업 종류를 선택해주세요." }]}>
              <Select
                options={[
                  { label: "영화 정보 가져오기", value: "movies" },
                  { label: "TV 정보 가져오기", value: "tv" },
                  { label: "OTT 정보 맞추기", value: "ott" },
                  { label: "변경된 정보만 가져오기", value: "delta" }
                ]}
              />
            </Form.Item>

            {selectedBatchType === "movies" || selectedBatchType === "tv" ? (
              <Form.Item label="기준 날짜" name="date">
                <DatePicker className="full-width-control" />
              </Form.Item>
            ) : null}

            {selectedBatchType === "ott" || selectedBatchType === "delta" ? (
              <Form.Item label="대상 종류" name="mediaType">
                <Select
                  options={[
                    { label: "영화", value: "MOVIE" },
                    { label: "TV", value: "TV" }
                  ]}
                />
              </Form.Item>
            ) : null}

            {selectedBatchType === "delta" ? (
              <>
                <Form.Item label="시작일" name="startDate">
                  <DatePicker className="full-width-control" />
                </Form.Item>
                <Form.Item label="종료일" name="endDate">
                  <DatePicker className="full-width-control" />
                </Form.Item>
              </>
            ) : null}

            <Button type="primary" htmlType="submit" loading={batchMutation.isPending}>
              업데이트 시작
            </Button>
          </Form>
        </Card>

        <Card title="진행 상태">
          {batchMutation.data ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="작업 이름">{formatBatchJobName(batchMutation.data.jobName)}</Descriptions.Item>
              <Descriptions.Item label="처리 번호">{batchMutation.data.executionId}</Descriptions.Item>
              <Descriptions.Item label="상태">{formatBatchStatus(batchMutation.data.status)}</Descriptions.Item>
              <Descriptions.Item label="요청 시각">{batchMutation.data.createTime.replace("T", " ")}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">업데이트를 시작하면 진행 상태가 여기에 표시됩니다.</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  );
}

function formatOptionalDate(value: Dayjs | undefined) {
  return value?.format("YYYY-MM-DD");
}

function formatBatchJobName(value: string) {
  const labels: Record<string, string> = {
    tmdbMovieImportJob: "영화 정보 가져오기",
    tmdbTvImportJob: "TV 정보 가져오기",
    ottProviderSyncJob: "OTT 정보 맞추기",
    tmdbDeltaImportJob: "변경된 정보 가져오기"
  };

  return labels[value] ?? value;
}

function formatBatchStatus(value: string) {
  const labels: Record<string, string> = {
    STARTING: "시작 중",
    STARTED: "진행 중",
    COMPLETED: "완료",
    FAILED: "실패",
    STOPPED: "중지됨"
  };

  return labels[value] ?? value;
}
