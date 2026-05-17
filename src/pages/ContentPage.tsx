import { useMutation } from "@tanstack/react-query";
import { App as AntApp, Button, Card, Checkbox, Descriptions, Form, Input, InputNumber, Typography } from "antd";

import { updateContent } from "../shared/api/adminEndpoints";
import type { AdminContentUpdateReq } from "../shared/api/adminTypes";

interface ContentFormValues {
  contentId: number;
  title?: string;
  year?: number;
  author?: string;
  description?: string;
  poster?: string;
  genreNamesText?: string;
  removeGenres?: boolean;
}

export function ContentPage() {
  const { message } = AntApp.useApp();
  const [form] = Form.useForm<ContentFormValues>();
  const contentMutation = useMutation({
    mutationFn: ({ contentId, payload }: { contentId: number; payload: AdminContentUpdateReq }) =>
      updateContent(contentId, payload),
    onSuccess: () => {
      void message.success("콘텐츠 정보를 수정했습니다.");
    }
  });

  const handleFinish = (values: ContentFormValues) => {
    const payload = buildContentUpdatePayload(values);

    if (Object.keys(payload).length === 0) {
      void message.warning("수정할 값을 하나 이상 입력해주세요.");
      return;
    }

    contentMutation.mutate({
      contentId: values.contentId,
      payload
    });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>콘텐츠</Typography.Title>
          <Typography.Paragraph>
            콘텐츠 ID를 기준으로 단건 메타데이터 수정 API를 호출합니다.
          </Typography.Paragraph>
        </div>
      </header>

      <div className="section-grid">
        <Card title="콘텐츠 수정">
          <Form<ContentFormValues>
            form={form}
            layout="vertical"
            requiredMark={false}
            initialValues={{ removeGenres: false }}
            onFinish={handleFinish}
          >
            <Form.Item
              label="콘텐츠 ID"
              name="contentId"
              rules={[{ required: true, message: "콘텐츠 ID를 입력해주세요." }]}
            >
              <InputNumber min={1} precision={0} className="full-width-control" />
            </Form.Item>
            <Form.Item label="제목" name="title">
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item label="연도" name="year">
              <InputNumber min={0} precision={0} className="full-width-control" />
            </Form.Item>
            <Form.Item label="감독/작가" name="author">
              <Input maxLength={255} />
            </Form.Item>
            <Form.Item label="설명" name="description">
              <Input.TextArea rows={4} />
            </Form.Item>
            <Form.Item label="포스터 이미지 키 또는 URL" name="poster">
              <Input />
            </Form.Item>
            <Form.Item label="장르명" name="genreNamesText" extra="쉼표로 구분합니다. 비워두면 기존 장르를 유지합니다.">
              <Input placeholder="액션, SF" />
            </Form.Item>
            <Form.Item name="removeGenres" valuePropName="checked">
              <Checkbox>장르를 모두 제거합니다.</Checkbox>
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={contentMutation.isPending}>
              콘텐츠 수정
            </Button>
          </Form>
        </Card>

        <Card title="수정 결과">
          {contentMutation.data ? (
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="콘텐츠 ID">{contentMutation.data.id}</Descriptions.Item>
              <Descriptions.Item label="TMDB ID">{contentMutation.data.tmdbId}</Descriptions.Item>
              <Descriptions.Item label="미디어 타입">{contentMutation.data.mediaType}</Descriptions.Item>
              <Descriptions.Item label="제목">{contentMutation.data.title}</Descriptions.Item>
              <Descriptions.Item label="연도">{contentMutation.data.year}</Descriptions.Item>
              <Descriptions.Item label="감독/작가">{contentMutation.data.author}</Descriptions.Item>
              <Descriptions.Item label="북마크 수">{contentMutation.data.bookmarkCount}</Descriptions.Item>
              <Descriptions.Item label="장르">{contentMutation.data.genreNames.join(", ") || "-"}</Descriptions.Item>
            </Descriptions>
          ) : (
            <Typography.Text type="secondary">수정 요청이 완료되면 응답 결과가 여기에 표시됩니다.</Typography.Text>
          )}
        </Card>
      </div>
    </div>
  );
}

function buildContentUpdatePayload(values: ContentFormValues): AdminContentUpdateReq {
  const payload: AdminContentUpdateReq = {};
  const title = normalizeOptionalText(values.title);
  const author = normalizeOptionalText(values.author);
  const description = normalizeOptionalText(values.description);
  const poster = normalizeOptionalText(values.poster);
  const genreNamesText = normalizeOptionalText(values.genreNamesText);

  if (title) {
    payload.title = title;
  }

  if (values.year !== undefined && values.year !== null) {
    payload.year = values.year;
  }

  if (author) {
    payload.author = author;
  }

  if (description) {
    payload.description = description;
  }

  if (poster) {
    payload.poster = poster;
  }

  if (values.removeGenres) {
    payload.genreNames = [];
  } else if (genreNamesText) {
    payload.genreNames = genreNamesText
      .split(",")
      .map((genreName) => genreName.trim())
      .filter(Boolean);
  }

  return payload;
}

function normalizeOptionalText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized || undefined;
}
