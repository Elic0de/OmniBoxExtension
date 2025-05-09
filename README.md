# OmniBoxExtension

このChrome拡張機能は、Omnibox（Chromeのアドレスバー）を使って、ChatGPTからの回答を簡単にコピーして貼り付けることができるツールです。作業効率を高めるため、素早くChatGPTの回答にアクセスし、他のアプリケーションやウェブページに貼り付けることができます。

> a chrome extension tools built with Vite + React, and Manifest v3

## 機能
- Omnibox統合: Chromeのアドレスバーから直接ChatGPTの回答にアクセスできます。
- 即座にコピー＆ペースト: コマンド一つで回答をクリップボードにコピー。
- シームレスな操作体験: 作業中のタブを切り替えたり、別のウィンドウを開いたりすることなく、すぐに回答を取得できます。

## 使用技術
- フロントエンド: React, TypeScript
- AI: OpenAI WebApp

## インストール方法

1. [ダウンロードリンク] から拡張機能をダウンロードします
2. Chromeを開き、chrome://extensions/ にアクセスします。
3. 開発者モードを有効にします。
4. パッケージ化されていない拡張機能を読み込むをクリックし、拡張機能のフォルダを選択します。

## 使い方
1. Omnibox（アドレスバー）に拡張機能のキーワード（例: `c クエリ`）と共に質問を入力します。
2. Enterキーを押すと、ChatGPTから回答を取得し、その回答をクリップボードにコピーします。
3. 必要な場所にその回答を貼り付けます。

## Installing

1. Check if your `Node.js` version is >= **14**.
2. Change or configurate the name of your extension on `src/manifest`.
3. Run `npm install` to install the dependencies.

## Developing

run the command

```shell
$ cd omniBoxExtension

$ npm run dev
```

### Chrome Extension Developer Mode

1. set your Chrome browser 'Developer mode' up
2. click 'Load unpacked', and select `omniBoxExtension/build` folder

### Nomal FrontEnd Developer Mode

1. access `http://0.0.0.0:3000/`
2. when debugging popup page, open `http://0.0.0.0:3000//popup.html`
3. when debugging options page, open `http://0.0.0.0:3000//options.html`

## Packing

After the development of your extension run the command

```shell
$ npm run build
```

Now, the content of `build` folder will be the extension ready to be submitted to the Chrome Web Store. Just take a look at the [official guide](https://developer.chrome.com/webstore/publish) to more infos about publishing.

---

Generated by [create-chrome-ext](https://github.com/guocaoyi/create-chrome-ext)
