import { useMutation } from "@tanstack/react-query";
import { App as AntApp, Button, Card, Descriptions, Form, Input, Select, Typography } from "antd";

import { triggerBatch } from "../shared/api/adminEndpoints";
import type { BatchTriggerReq, BatchType, MediaType } from "../shared/api/adminTypes";

interface BatchFormValues {
  type: BatchType;
  date?: string;
  mediaType: MediaType;
  startDate?: string;
  endDate?: string;
}

export function BatchPage() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<BatchFormValues>();
  const selectedBatchType = Form.useWatch("type", form) ?? "movies";
  const batchMutation = useMutation({
    mutationFn: (values: BatchTriggerReq) => triggerBatch(values),
    onSuccess: () => {
      void message.success("배치 실행을 요청했습니다.");
    }
  });

  const handleFinish = (values: BatchFormValues) => {
    batchMutation.mutate({
      type: values.type,
      date: normalizeOptionalText(values.date),
      mediaType: values.mediaType,
      startDate: normalizeOptionalText(values.startDate),
      endDate: normalizeOptionalText(values.endDate)
    });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>배치 실행</Typography.Title>
          <Typography.Paragraph>
            Admin API에 연결된 TMDB 배치 작업을 직접 실행합니다.
          </Typography.Paragraph>
        </div>
      </header>

      <div className="section-grid">
        <Card title="배치 요청">
          <Form<BatchFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ type: "movies", mediaType: "MOVIE" }}
            onFinish={handleFinish}
          >
            <Form.Item label="배치 유형" name="type" rules={[{ required: true, message: "배치 유형을 선택해주세요." }]}>
              <Select
                options={[
                  { label: "영화 가져오기 (movies)", value: "movies" },
                  { label: "TV 가져오기 (tv)", value: "tv" },
                  { label: "OTT 동기화 (ott)", value: "ott" },
                  { label: "일일 변경분 (delta)", value: "delta" }
                ]}
              />
            </Form.Item>

            {selectedBatchType === "movies" || selectedBatchType === "tv" ? (
              <Form.Item label="기준 날짜" name="date" extra="선택 입력입니다. 예: 2026-05-17">
                <Input />
              </Form.Item>
            ) : null}

            {selectedBatchType === "ott" || selectedBatchType === "delta" ? (
              <Form.Item label="미디어 타입" name="mediaType">
                <Select
                  options={[
                    { label: "영화 (MOVIE)", value: "MOVIE" },
                    { label: "TV (TV)", value: "TV" }
                  ]}
                />
              </Form.Item>
            ) : null}

            {selectedBatchType === "delta" ? (
              <>
                <Form.Item label="시작일" name="startDate" extra="선택 입력입니다. 예: 2026-05-01">
                  <Input />
                </Form.Item>
                <Form.Item label="종료일" name="endDate" extra="선택 입력입니다. 예: 2026-05-17">
                  <Input />
                </Form.Item>
              </>
            ) : null}

            <Button type="primary" htmlType="submit" loading={batchMutation.isPending}>
              배치 실행
            </Button>
          </Form>
        </Card>

        <Card title="실행 결과">
          {batchMutation.data ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Job 이름">{batchMutation.data.jobName}</Descriptions.Item>
              <Descriptions.Item label="Execution ID">{batchMutation.data.executionId}</Descriptions.Item>
              <Descriptions.Item label="상태">{batchMutation.data.status}</Descriptions.Item>
              <Descriptions.Item label="생성 시각">{batchMutation.data.createTime}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">배치 실행 요청이 완료되면 응답 결과가 여기에 표시됩니다.</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  );
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}
