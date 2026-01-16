import Link from "next/link";
import { ArrowLeft, ExternalLink, Shield } from "lucide-react";

import { Text } from "@/components/ui/Text";

export const metadata = {
  title: "プライバシーポリシー | Myelin Base",
  description: "Myelin Baseのプライバシーポリシーについて",
};

export default function PrivacyPage() {
  return (
    <div className="h-screen overflow-y-auto bg-background">
      {/* ヘッダー */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-2">
          <Link
            href="/chat"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            <Text variant="sm" color="muted">
              チャット画面に戻る
            </Text>
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Shield className="size-6 text-primary" />
          <Text variant="h3" as="h3">
            プライバシーポリシー
          </Text>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
          {/* 概要 */}
          <section>
            <Text className="text-muted-foreground" leading="relaxed">
              Myelin
              Base（以下「本サービス」）は、ユーザーのプライバシーを尊重し、
              個人情報の保護に努めています。本ポリシーでは、収集する情報とその取り扱いについて説明します。
            </Text>
          </section>

          {/* 1. 収集する情報 */}
          <section>
            <Text variant="h4" as="h4" className="mb-4">
              1. 収集する情報
            </Text>
            <Text className="text-muted-foreground mb-3">
              本サービスでは、以下の情報を収集します：
            </Text>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                <strong>アカウント情報</strong>：メールアドレス、ユーザー名
              </li>
              <li>
                <strong>アップロードデータ</strong>
                ：ユーザーがアップロードしたドキュメント（PDF、テキストファイル等）
              </li>
              <li>
                <strong>チャット履歴</strong>：AIとの会話内容
              </li>
            </ul>
          </section>

          {/* 2. 情報の利用目的 */}
          <section>
            <Text variant="h4" as="h4" className="mb-4">
              2. 情報の利用目的
            </Text>
            <Text className="text-muted-foreground mb-3">
              収集した情報は、以下の目的でのみ使用します：
            </Text>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>サービスの提供・運営</li>
              <li>ユーザー認証</li>
              <li>RAG（検索拡張生成）によるAI回答の生成</li>
            </ul>
          </section>

          {/* 3. AI処理について */}
          <section>
            <Text variant="h4" as="h4" className="mb-4">
              3. AI処理について
            </Text>
            <Text className="text-muted-foreground mb-3">
              本サービスでは、Amazon Bedrockを使用してAI処理を行っています。
            </Text>
            <div className="bg-primary/10 border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-green-500 mt-0.5 flex-shrink-0" />
                <Text variant="sm" className="text-muted-foreground">
                  <strong>モデルトレーニングへの不使用</strong>：Amazon
                  Bedrockは、ユーザーのデータをAIモデルのトレーニングに使用しません。
                </Text>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="size-4 text-green-500 mt-0.5 flex-shrink-0" />
                <Text variant="sm" className="text-muted-foreground">
                  <strong>データの暗号化</strong>
                  ：すべてのデータは転送中および保存中に暗号化されます。
                </Text>
              </div>
            </div>
            <Text variant="sm" className="text-muted-foreground mt-3">
              詳細は{" "}
              <a
                href="https://aws.amazon.com/bedrock/faqs/#Data_privacy_and_security"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                Amazon Bedrock のデータプライバシー
                <ExternalLink className="w-3 h-3" />
              </a>{" "}
              をご覧ください。
            </Text>
          </section>

          {/* 4. データの保存 */}
          <section>
            <Text variant="h4" as="h4" className="mb-4">
              4. データの保存
            </Text>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground">
              <li>
                データはAWS（東京リージョン: ap-northeast-1）に保存されます
              </li>
              <li>ユーザーはいつでも自身のデータを削除できます</li>
              <li>アカウント削除時、関連するすべてのデータが削除されます</li>
            </ul>
          </section>

          {/* 5. 第三者への提供 */}
          <section>
            <Text variant="h4" as="h4" className="mb-4">
              5. 第三者への提供
            </Text>
            <Text className="text-muted-foreground">
              法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
            </Text>
          </section>

          {/* 6. お問い合わせ */}
          <section>
            <Text variant="h4" as="h4" className="mb-3">
              6. お問い合わせ
            </Text>
            <Text className="text-muted-foreground" leading="relaxed">
              プライバシーに関するお問い合わせは、下記メールアドレスまでお願いいたします。
              <br />
              <a
                href="mailto:cloud@myelinbase.com"
                className="text-primary hover:underline inline-flex items-center gap-1 mx-1"
              >
                cloud@myelinbase.com
              </a>
            </Text>
          </section>

          {/* 更新日 */}
          <section className="pt-8 border-t border-border">
            <Text variant="sm" className="text-muted-foreground">
              最終更新日: 2025年1月
            </Text>
          </section>
        </div>
      </main>
    </div>
  );
}
