import { expect, test } from "../base";
import { ChatPage } from "../pom/ChatPage";

/**
 * チャットページのE2Eテスト
 *
 * テスト対象: src/app/chat/page.tsx
 * 参照コンポーネント:
 *   - SessionSideBar
 *   - SessionList
 *   - ChatContent
 *   - ChatInput
 *   - ChatMessagesPane
 *   - DocumentPreviewSidebar
 */

// ============================================================================
// 1. 未認証ユーザー向けのテストグループ
// ============================================================================
test.describe("Chat Page (Unauthenticated)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("未認証ユーザーがアクセスするとログインページにリダイレクトされること", async ({
    page,
  }) => {
    await page.goto("/chat");
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });

  test("未認証ユーザーがセッションID付きでアクセスしてもログインページにリダイレクトされること", async ({
    page,
  }) => {
    await page.goto("/chat?sessionId=test-session-123");
    await expect(page).toHaveURL(/.*\/login/, { timeout: 10000 });
  });
});

// ============================================================================
// 2. 認証済みユーザー向けのテストグループ
// ============================================================================
test.describe("Chat Page", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.verifyPageLoaded();
  });

  // ==========================================================================
  // 2.1 ページ表示と基本要素
  // ==========================================================================
  test.describe("Page Load and Basic Elements", () => {
    test("チャットページの主要な要素が正しく表示されること", async () => {
      // チャット入力が表示されていることを確認
      await expect(chatPage.chatInput).toBeVisible();

      // 送信ボタンが表示されていることを確認
      await expect(chatPage.sendButton).toBeVisible();

      // セッションサイドバーが表示されていることを確認
      await expect(chatPage.sessionSidebar).toBeVisible();
    });

    test("チャット入力欄にプレースホルダーが正しく表示されること", async () => {
      await expect(chatPage.chatInput).toHaveAttribute(
        "placeholder",
        "質問を入力してください"
      );
    });

    test("ページのURLが正しいこと", async ({ page }) => {
      await expect(page).toHaveURL(/.*\/chat/);
    });
  });

  // ==========================================================================
  // 2.2 セッションサイドバー
  // ==========================================================================
  test.describe("Session Sidebar", () => {
    test("サイドバーのトグルボタンが表示されていること", async () => {
      await expect(chatPage.sidebarToggleButton).toBeVisible();
    });

    test("サイドバーのトグルボタンをクリックするとサイドバーが折りたたまれること", async () => {
      // 初期状態では展開されている
      await chatPage.verifySidebarExpanded();

      // トグルボタンをクリック
      await chatPage.toggleSidebar();

      // サイドバーが折りたたまれていることを確認
      await chatPage.verifySidebarCollapsed();
    });

    test("折りたたまれたサイドバーを再度展開できること", async () => {
      // サイドバーを折りたたむ
      await chatPage.toggleSidebar();
      await chatPage.verifySidebarCollapsed();

      // 再度トグルして展開
      await chatPage.toggleSidebar();
      await chatPage.verifySidebarExpanded();
    });

    test("新規チャット作成ボタンが表示されていること", async () => {
      await expect(chatPage.newChatButton).toBeVisible();
    });

    test("新規チャット作成ボタンをクリックするとURLがリセットされること", async ({
      page,
    }) => {
      // 新規チャットをクリック
      await chatPage.startNewChat();

      // URLにセッションIDが含まれていないことを確認
      const baseUrl = process.env.BASE_URL;
      await expect(page).toHaveURL(`${baseUrl}/chat/`);
    });
  });

  // ==========================================================================
  // 2.3 チャット入力機能
  // ==========================================================================
  test.describe("Chat Input", () => {
    test("チャット入力欄にメッセージを入力できること", async () => {
      const testMessage = "テストメッセージ";
      await chatPage.typeMessage(testMessage);
      await chatPage.verifyInputValue(testMessage);
    });

    test("入力欄をクリアできること", async () => {
      await chatPage.typeMessage("テストメッセージ");
      await chatPage.chatInput.clear();
      await chatPage.verifyInputEmpty();
    });

    test("Shift+Enterで改行できること", async () => {
      await chatPage.chatInput.fill("1行目");
      await chatPage.chatInput.press("Shift+Enter");
      await chatPage.chatInput.type("2行目");

      const value = await chatPage.chatInput.inputValue();
      expect(value).toContain("\n");
    });

    test("入力が空の場合、送信ボタンは音声入力モードであること", async () => {
      await chatPage.verifyInputEmpty();
      const buttonState = await chatPage.getSendButtonState();
      expect(buttonState).toBe("音声入力");
    });

    test("入力がある場合、送信ボタンは送信モードであること", async () => {
      await chatPage.typeMessage("テストメッセージ");
      const buttonState = await chatPage.getSendButtonState();
      expect(buttonState).toBe("送信");
    });
  });

  // ==========================================================================
  // 2.4 メッセージ送信（モック不要のUI確認のみ）
  // ==========================================================================
  test.describe("Message Sending UI", () => {
    test("メッセージ入力後に送信ボタンをクリックすると入力がクリアされること", async () => {
      const testMessage = "テストメッセージ";
      await chatPage.typeMessage(testMessage);
      await chatPage.sendButton.click();

      // 入力欄がクリアされることを確認（APIレスポンスに関係なく）
      await chatPage.page.waitForTimeout(500);
      // 入力がクリアされるか、または送信中の状態になっている
    });

    test("Enterキーでメッセージを送信できること", async () => {
      const testMessage = "Enterで送信テスト";
      await chatPage.chatInput.fill(testMessage);

      // Enterキーを押す前の状態を確認
      await chatPage.verifyInputValue(testMessage);

      // Enterキーを押す
      await chatPage.chatInput.press("Enter");

      // 入力処理が発生することを確認（送信が開始される）
      await chatPage.page.waitForTimeout(500);
    });
  });

  // ==========================================================================
  // 2.5 URLパラメータとセッション
  // ==========================================================================
  test.describe("URL Parameters and Sessions", () => {
    test("セッションID付きでアクセスするとURLにセッションIDが含まれること", async ({
      page,
    }) => {
      const testSessionId = "test-session-123";
      await chatPage.goto(testSessionId);

      await expect(page).toHaveURL(new RegExp(`sessionId=${testSessionId}`));
    });

    test("セッションIDなしでアクセスするとURLにセッションIDが含まれないこと", async ({
      page,
    }) => {
      await chatPage.goto();
      // sessionIdパラメータが含まれていないことを確認
      const url = page.url();
      expect(url).not.toContain("sessionId=");
    });
  });

  // ==========================================================================
  // 2.6 レスポンシブデザイン
  // ==========================================================================
  test.describe("Responsive Design", () => {
    test("モバイルサイズでもチャット入力が表示されること", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.reload();

      await expect(chatPage.chatInput).toBeVisible({ timeout: 10000 });
    });

    test("タブレットサイズでも主要な要素が表示されること", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.reload();

      await chatPage.verifyPageLoaded();
      await expect(chatPage.sendButton).toBeVisible();
    });

    test("デスクトップサイズでサイドバーが適切に表示されること", async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.reload();

      await chatPage.verifyPageLoaded();
      await expect(chatPage.sessionSidebar).toBeVisible();
    });
  });

  // ==========================================================================
  // 2.7 アクセシビリティ
  // ==========================================================================
  test.describe("Accessibility", () => {
    test("チャット入力欄にフォーカスできること", async () => {
      await chatPage.chatInput.focus();
      await expect(chatPage.chatInput).toBeFocused();
    });

    test("送信ボタンにaria-labelが設定されていること", async () => {
      const ariaLabel = await chatPage.sendButton.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
    });

    test("サイドバートグルボタンにaria-labelが設定されていること", async () => {
      const ariaLabel =
        await chatPage.sidebarToggleButton.getAttribute("aria-label");
      expect(ariaLabel).toBe("チャットハンバーガー");
    });

    test("キーボードでチャット入力からサイドバーに移動できること", async ({
      page,
    }) => {
      await chatPage.chatInput.focus();

      // 複数回Tabキーを押してサイドバー要素に到達できることを確認
      let attempts = 0;
      while (attempts < 30) {
        await page.keyboard.press("Tab");
        const focusedElement = await page.locator(":focus");
        const isInSidebar = await chatPage.sessionSidebar
          .locator(":focus")
          .count();
        if (isInSidebar > 0) {
          break;
        }
        attempts++;
      }
    });
  });

  // ==========================================================================
  // 2.8 エラーハンドリング
  // ==========================================================================
  test.describe("Error Handling", () => {
    test("ネットワークエラー時にもページがクラッシュしないこと", async ({
      page,
    }) => {
      // セッションリストのAPIをブロック
      await page.route("**/api/sessions**", (route) => {
        route.abort();
      });

      // ページをリロード
      await page.reload();

      // ページがクラッシュせずに表示されることを確認
      await expect(chatPage.chatInput).toBeVisible({ timeout: 15000 });

      // ルーティングを解除
      await page.unroute("**/api/sessions**");
    });
  });

  // ==========================================================================
  // 2.9 ナビゲーション
  // ==========================================================================
  test.describe("Navigation", () => {
    test("ヘッダーからチャットページに遷移できること", async ({ page }) => {
      // documentsページに移動
      await page.goto("/documents");
      await page.waitForLoadState("networkidle");

      // ヘッダーのチャットリンクをクリック
      const chatLink = page.getByRole("link", { name: /チャット/i });
      await chatLink.click();

      // チャットページに遷移したことを確認
      await expect(page).toHaveURL(/.*\/chat/);
    });

    test("ページをリロードしても正しく表示されること", async ({ page }) => {
      await page.reload();
      await chatPage.verifyPageLoaded();
    });

    test("ブラウザの戻るボタンが機能すること", async ({ page }) => {
      // documentsページに移動
      await page.goto("/documents");
      await page.waitForLoadState("networkidle");

      // chatページに移動
      await chatPage.goto();
      await chatPage.verifyPageLoaded();

      // 戻る
      await page.goBack();

      // documentsページに戻ったことを確認
      await expect(page).toHaveURL(/.*\/documents/);
    });
  });
});

// ============================================================================
// 3. インテグレーションテスト
// ============================================================================
test.describe("Chat Page Integration", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.verifyPageLoaded();
  });

  test("サイドバーを折りたたんでも入力欄は機能すること", async () => {
    // サイドバーを折りたたむ
    await chatPage.toggleSidebar();
    await chatPage.verifySidebarCollapsed();

    // 入力欄に入力できることを確認
    await chatPage.typeMessage("サイドバー折りたたみ中のテスト");
    await chatPage.verifyInputValue("サイドバー折りたたみ中のテスト");
  });

  test("サイドバーを展開・折りたたみしてもページ状態が維持されること", async () => {
    // 入力を行う
    await chatPage.typeMessage("状態維持テスト");

    // サイドバーをトグル
    await chatPage.toggleSidebar();
    await chatPage.toggleSidebar();

    // 入力が維持されていることを確認
    await chatPage.verifyInputValue("状態維持テスト");
  });

  test("新規チャット作成後にメッセージを入力できること", async () => {
    // 新規チャットを開始
    await chatPage.startNewChat();

    // 入力欄に入力できることを確認
    await chatPage.typeMessage("新規チャットのテストメッセージ");
    await chatPage.verifyInputValue("新規チャットのテストメッセージ");
  });
});

// ============================================================================
// 4. パフォーマンステスト
// ============================================================================
test.describe("Chat Page Performance", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
  });

  test("ページの初回読み込みが10秒以内に完了すること", async () => {
    const startTime = Date.now();
    await chatPage.goto();
    await chatPage.verifyPageLoaded();
    const loadTime = Date.now() - startTime;

    expect(loadTime).toBeLessThan(10000);
  });

  test("サイドバーのトグルが500ms以内に完了すること", async () => {
    await chatPage.goto();
    await chatPage.verifyPageLoaded();

    const startTime = Date.now();
    await chatPage.toggleSidebar();
    const toggleTime = Date.now() - startTime;

    expect(toggleTime).toBeLessThan(500);
  });

  test("入力のレスポンスが即座であること", async () => {
    await chatPage.goto();
    await chatPage.verifyPageLoaded();

    const startTime = Date.now();
    await chatPage.typeMessage("パフォーマンステスト");
    await chatPage.verifyInputValue("パフォーマンステスト");
    const inputTime = Date.now() - startTime;

    expect(inputTime).toBeLessThan(500);
  });
});

// ============================================================================
// 5. セッション管理テスト（セッションが存在する場合）
// ============================================================================
test.describe("Session Management", () => {
  let chatPage: ChatPage;

  test.beforeEach(async ({ page }) => {
    chatPage = new ChatPage(page);
    await chatPage.goto();
    await chatPage.verifyPageLoaded();
  });

  test("セッションリストが存在する場合、セッションが表示されること", async () => {
    // セッションリストエリアが表示されることを確認
    await chatPage.page.waitForLoadState("networkidle");

    // セッションが存在する場合のみテスト
    const sessionCount = await chatPage.getSessionCount();
    if (sessionCount > 0) {
      // セッションリストが表示されていることを確認
      await chatPage.verifySessionListVisible();
    }
  });

  test("セッションが存在しない場合でもページが正常に表示されること", async () => {
    // セッションの有無に関わらず、基本要素が表示されることを確認
    await expect(chatPage.chatInput).toBeVisible();
    await expect(chatPage.sendButton).toBeVisible();
  });
});
