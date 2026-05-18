import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { App as AntApp, Alert, Button, Card, Checkbox, Descriptions, Drawer, Form, Input, InputNumber, Select, Space, Table, Tag, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useEffect, useState } from "react";

import { adminQueryKeys, getAdminContents, updateContent } from "../shared/api/adminEndpoints";
import type { AdminContentRes, AdminContentUpdateReq, MediaType } from "../shared/api/adminTypes";

interface ContentFormValues {
  title?: string;
  year?: number;
  author?: string;
  description?: string;
  poster?: string;
  genreNamesText?: string;
  removeGenres?: boolean;
}

type MediaTypeFilter = MediaType | "ALL";

export function ContentPage() {
  const { message } = AntApp.useApp();
  const queryClient = useQueryClient();
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState<string | undefined>();
  const [mediaType, setMediaType] = useState<MediaTypeFilter>("ALL");
  const [cursor, setCursor] = useState<string | undefined>();
  const [selectedContent, setSelectedContent] = useState<AdminContentRes | null>(null);
  const [form] = Form.useForm<ContentFormValues>();
  const listParams = {
    keyword,
    mediaType: mediaType === "ALL" ? undefined : mediaType,
    cursor,
    size: 10
  };
  const contentsQuery = useQuery({
    queryKey: adminQueryKeys.contents(listParams),
    queryFn: () => getAdminContents(listParams)
  });
  const contentMutation = useMutation({
    mutationFn: ({ contentId, payload }: { contentId: number; payload: AdminContentUpdateReq }) =>
      updateContent(contentId, payload),
    onSuccess: async (content) => {
      setSelectedContent(content);
      void message.success("컨텐츠 정보를 수정했습니다.");
      await queryClient.invalidateQueries({ queryKey: ["admin", "contents"] });
    }
  });

  useEffect(() => {
    if (!selectedContent) {
      return;
    }

    form.setFieldsValue({
      title: selectedContent.title,
      year: selectedContent.year,
      author: selectedContent.author,
      description: selectedContent.description,
      poster: selectedContent.posterUrl ?? undefined,
      genreNamesText: selectedContent.genreNames.join(", "),
      removeGenres: false
    });
  }, [form, selectedContent]);

  const columns: ColumnsType<AdminContentRes> = [
    { title: "제목", dataIndex: "title", key: "title" },
    {
      title: "종류",
      dataIndex: "mediaType",
      key: "mediaType",
      width: 90,
      render: (value: MediaType) => <Tag>{formatMediaType(value)}</Tag>
    },
    { title: "연도", dataIndex: "year", key: "year", width: 90 },
    { title: "감독/작가", dataIndex: "author", key: "author" },
    { title: "저장 수", dataIndex: "bookmarkCount", key: "bookmarkCount", width: 90 },
    {
      title: "작업",
      key: "action",
      width: 100,
      render: (_, content) => (
        <Button type="link" onClick={() => setSelectedContent(content)}>
          수정하기
        </Button>
      )
    }
  ];

  const handleSearch = (value: string) => {
    setKeyword(normalizeOptionalText(value));
    setCursor(undefined);
  };

  const handleFinish = (values: ContentFormValues) => {
    if (!selectedContent) {
      return;
    }

    const payload = buildContentUpdatePayload(values);
    if (Object.keys(payload).length === 0) {
      void message.warning("수정할 값을 하나 이상 입력해주세요.");
      return;
    }

    contentMutation.mutate({
      contentId: selectedContent.id,
      payload
    });
  };

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <Typography.Title level={1}>Contents</Typography.Title>
        </div>
      </header>

      <Card
        title="컨텐츠 목록"
        extra={
          <Space>
            <Input.Search
              allowClear
              placeholder="제목 검색"
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              onSearch={handleSearch}
            />
            <Select<MediaTypeFilter>
              aria-label="컨텐츠 종류"
              value={mediaType}
              className="status-select"
              onChange={(value) => {
                setMediaType(value);
                setCursor(undefined);
              }}
              options={[
                { label: "전체", value: "ALL" },
                { label: "영화", value: "MOVIE" },
                { label: "TV", value: "TV" }
              ]}
            />
            <Button onClick={() => contentsQuery.refetch()} loading={contentsQuery.isFetching}>
              새로고침
            </Button>
          </Space>
        }
      >
        {contentsQuery.isError ? <Alert type="error" showIcon message="컨텐츠 목록을 불러오지 못했습니다." /> : null}
        <Table
          rowKey="id"
          columns={columns}
          dataSource={contentsQuery.data?.data ?? []}
          loading={contentsQuery.isPending}
          pagination={false}
        />
        <div className="table-actions">
          <Typography.Text type="secondary">
            목록 {contentsQuery.data?.meta.returned ?? 0}건
            {contentsQuery.data?.meta.nextCursor ? " · 다음 목록이 있습니다" : ""}
          </Typography.Text>
          <Button
            disabled={!contentsQuery.data?.meta.nextCursor}
            onClick={() => setCursor(contentsQuery.data?.meta.nextCursor ?? undefined)}
          >
            다음 목록
          </Button>
        </div>
      </Card>

      <Drawer
        title="컨텐츠 정보 수정"
        size="large"
        open={selectedContent !== null}
        onClose={() => setSelectedContent(null)}
        destroyOnHidden
      >
        {selectedContent ? (
          <div className="drawer-stack">
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="종류">{formatMediaType(selectedContent.mediaType)}</Descriptions.Item>
              <Descriptions.Item label="저장 수">{selectedContent.bookmarkCount}</Descriptions.Item>
            </Descriptions>
            <Form<ContentFormValues> form={form} layout="vertical" requiredMark={false} onFinish={handleFinish}>
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
              <Form.Item label="포스터 이미지 주소" name="poster">
                <Input />
              </Form.Item>
              <Form.Item label="장르" name="genreNamesText" extra="여러 장르는 쉼표로 구분합니다. 비워두면 기존 장르를 유지합니다.">
                <Input placeholder="액션, SF" />
              </Form.Item>
              <Form.Item name="removeGenres" valuePropName="checked">
                <Checkbox>장르를 모두 제거합니다.</Checkbox>
              </Form.Item>
              <Button type="primary" htmlType="submit" loading={contentMutation.isPending}>
                수정하기
              </Button>
            </Form>
          </div>
        ) : null}
      </Drawer>
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

function formatMediaType(value: string) {
  if (value === "MOVIE") {
    return "영화";
  }

  if (value === "TV") {
    return "TV";
  }

  return value;
}
