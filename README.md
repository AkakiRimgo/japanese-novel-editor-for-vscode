# japanese-novel-editor README

このREADMEはjapanese-novel-editor（以下本拡張）のREADMEです。
日本人向けを対象とする予定ですが、外国人でも使える方法を模索していきたいですね。

==  
This is the README for japanese-novel-editor.
We plan to target the Japanese market, but we would like to find a way to make it work for foreigners as well.

## 各種機能　Features　

機能としまして以下を予定しております。

- 文字数を数える（vsrsion0.1.0）
- 設定ファイルに基づく主人公などの色分け
- 鉤括弧文の色付け
- 文法チェック
- その他各種便利機能（意見あればください）

==  

The following features are planned

- Character counting (vsrsion0.1.0)
- Color-coding of protagonists, etc. based on configuration files
- Colorization of bracketed sentences
- Grammar check
- Other useful features (please give us your suggestions)

## Requirements

今のところとくにありませんが、強いていうなら他の文字数カウンターと見た目が被ります。
There is nothing in particular at this point, but if I had to say, it looks like other character counters.

## 設定値 (Extension Settings)

この拡張には現在以下の設定値があります：

* `filename Config: tag`: ファイル名で選別する際のタグの名前を設定できます。始めの値はnovelです。

## これからすること

- 設定ファイルに基づく主人公などの色分け
- 鉤括弧文の色付け
- 文法チェック
- その他各種便利機能（意見あればください）

## Release Notes

### 0.1.0

文字数を数える機能を追加しました。
本機能は、特定ファイルの文字数を数える機能です。
特定ファイルとは、ファイル名に特定のタグ（設定で変更可能）がついたファイルです。
たとえば、"novel" というタグを設定している際には、"./story01.novel.txt" というファイルや、"./novel.version001.txt"などで適応されます。
一方で、"story001.novel01.txt"などのテキストには適応されません。
正規表現化するのは今後の課題といたします。

