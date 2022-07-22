import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import path = require ("path")

function getConfig():[string, boolean]{
    // setting Module
    const FILENAME_CONFIG = vscode.workspace.getConfiguration('filenameConfig');
    const TAG = FILENAME_CONFIG.get<string>('tag') || "novel";

    const WORDCOUNTER_CONFIG = vscode.workspace.getConfiguration('wordCounter');
    const IS_USE_WORD_COUNT = WORDCOUNTER_CONFIG.get<boolean>('isUseWordCount') || false;
    return [TAG, IS_USE_WORD_COUNT];
}

let [TAG, IS_USE_WORD_COUNT] = getConfig();
workspace.onDidChangeConfiguration(
    e => {[TAG, IS_USE_WORD_COUNT] = getConfig();}
);

// COMMANDS_NAME
const CO_NA = {
    changeCounterMode: "changeCounterMode",
    Start: "japanese-novel-editor.starn-novel-mode"
} as const; 

// COMMANDS_NAME_DEBUG
const CO_NA_DEBUG = {
    d1: "japanese-novel-editor.debug-command-01"
} as const; 

// eslint-disable-next-line @typescript-eslint/naming-convention
const Mode = {
    WC: "WordCount",
	CC: "CharacterCount",
	CCNNL: "CharacterCountNoNewLine",
	CCNS: "CharacterCountNoSpace",
} as const;

type Mode = typeof Mode[keyof typeof Mode];

function getFileName(fullPath:string){
	return fullPath.split('/')?.pop()?.split('\\').pop();
}

async function readFile(relativePath:string): Promise<string>{
    const wsFs = workspace.workspaceFolders;
    if(wsFs && wsFs.length===1){
        const fullPath = path.join(wsFs[0].uri.path, relativePath);
        console.log(`myDEBUG:\t${fullPath}`);
        const _uint8array = await workspace.fs.readFile(vscode.Uri.file(fullPath));
        return (new TextDecoder()).decode(_uint8array);
    }
    else{return `${wsFs}`;}
}

export function activate(context: vscode.ExtensionContext) {
    // start command
    const startCommand = vscode.commands.registerCommand(CO_NA.Start, () => {});
    context.subscriptions.push(startCommand);

    // create a new word counter
	const wordCounter = new WordCounter();

	// create controller
	const controller = new WordCounterController(wordCounter);

	// add
	context.subscriptions.push(controller);
	context.subscriptions.push(wordCounter);

    // create DebugClass
    const classForDebug = new DebugClass(context);
    context.subscriptions.push(classForDebug);
}

function newStatusBarItem(
    command: string, callback: (...args: any[]) => any,
    alignment?: vscode.StatusBarAlignment | undefined, 
    priority?: number | undefined,
    ){
        const _statusBarItem: StatusBarItem = window.createStatusBarItem(
            alignment, priority
        );
        commands.registerCommand(command, callback);
        _statusBarItem.command = command;
        return _statusBarItem;
}

class WordCounter {
    private _mode: Mode;
    private _statusBarItem: StatusBarItem;
    // mode to ??? dicsionary
	private mode2newmode: { [key in Mode]: Mode; };
	private mode2func: { [key in Mode]: (docContent: string) => number; };
	private mode2tag:{ [key in Mode]: string; };

	constructor(){
        this._mode = Mode.CC;
        this._statusBarItem = newStatusBarItem(
            CO_NA.changeCounterMode, () => { this.changeMode();}, 
            StatusBarAlignment.Left
        );
		// set functions
		this.mode2newmode= {
            [Mode.WC]: Mode.CC,
			[Mode.CC]: Mode.CCNNL,
			[Mode.CCNNL]: Mode.CCNS,
			[Mode.CCNS]: Mode.WC
		};
		this.mode2func = {
            [Mode.WC]: this._getWordCount,
			[Mode.CC]: this._getCharacterCount,
			[Mode.CCNNL]: this._getCharacterCountNoNewLine,
			[Mode.CCNS]: this._getCharacterCountNoSpace
		};
		this.mode2tag = {
            [Mode.WC]: "単語",
			[Mode.CC]: "文字",
			[Mode.CCNNL]: "文字（改行除く）",
			[Mode.CCNS]: "文字（空白文字除く）"
		};
		//
	}

    public updateWordCount() {
        // Get the current text editor
        const editor = window.activeTextEditor;
        if (!editor) {this.hideStatusBarItem(); return;}
        // Get document and selection range in editor
        const doc = editor.document;
		const selection = editor.selection;
        // Only update status if an MD file
        if (this._isTagInFilename(doc.fileName)) {
            // count word count
			const allCount = this._getCount(doc.getText());
			const selectionCount = this._getCount(doc.getText(selection));
            // Update the status bar
			this._showWordCount(allCount, selectionCount);
        } else {this.hideStatusBarItem();}
    }

	public changeMode() {
		const oldmode:Mode = this._mode;
		const newmode:Mode = this.mode2newmode[oldmode];
        if(newmode===Mode.WC&&(!IS_USE_WORD_COUNT)){
            console.log("myDEBUG:\t" + "Skip mode 'Word Count'");
            this._mode = this.mode2newmode[newmode];
        }else{this._mode = newmode;}
        this.updateWordCount();
        console.log("myDEBUG:\t" + "mode: " + oldmode + " to " + newmode);
	}

	public showStatusBarItem(text:string|undefined){
		if(text) {this._statusBarItem.text = text;}
        this._statusBarItem.show();
	}

	public hideStatusBarItem(){
        this._statusBarItem.hide();
	}

    private _isTagInFilename(fileName: string): boolean{
        const languageIds = getFileName(fileName)?.split('.')||[];
        return languageIds.includes(TAG)||TAG==='*';
    }

	private _showWordCount(allCount:number, selectionCount:number){
		const tag = this.mode2tag[this._mode];
        const selectInfo = selectionCount ===0
                            ? "": `${selectionCount}/ `;
		this.showStatusBarItem(
            `$(pencil) ${selectInfo}${allCount} ${tag}`
        );
	}

    private _getCount(docContent: string): number{
		return this.mode2func[this._mode](docContent);
	}

	private _getWordCount(docContent: string): number {
        // Parse out unwanted whitespace so the split is accurate
        docContent = docContent.replace(/(< ([^>]+)<)/g, '').replace(/\s+/g, ' ');
        docContent = docContent.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
        let wordCount = 0;
        if (docContent !== "") {
            wordCount = docContent.split(" ").length;
        }

        return wordCount;
    }

	private _getCharacterCount(docContent: string): number {
        return docContent.length;
    }

	private _getCharacterCountNoNewLine(docContent: string): number {
		docContent = docContent.replace(/\r?\n/g, '');
        return docContent.length;
    }

	private _getCharacterCountNoSpace(docContent: string): number {
		docContent = docContent.replace(/\s+/g, '');
        return docContent.length;
    }

    public dispose() {
        this._statusBarItem.dispose();
    }
}

class WordCounterController {
    private _wordCounter: WordCounter;
    private _disposable: Disposable;

    constructor(wordCounter: WordCounter) {
        this._wordCounter = wordCounter;
        this._wordCounter.updateWordCount();

        // subscribe to selection change and editor activation events
        let subscriptions: Disposable[] = [];
        window.onDidChangeTextEditorSelection(this._onEvent, this, subscriptions);
        window.onDidChangeActiveTextEditor(this._onEvent, this, subscriptions);

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);
    }

    private _onEvent() {
        this._wordCounter.updateWordCount();
    }

    public dispose() {
        this._disposable.dispose();
    }
}

class DebugClass {
    private context: vscode.ExtensionContext;
    private _disposable: Disposable;
    private _statusBarItem: StatusBarItem;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this._statusBarItem = newStatusBarItem(
            CO_NA_DEBUG.d1, () => { this._onEvent();}, 
            StatusBarAlignment.Left
        );
        this._statusBarItem.text = "debugButton";
        this._statusBarItem.show();

        // subscribe to selection change and editor activation events
        const subscriptions: Disposable[] = [];

        // create a combined disposable from both event subscriptions
        this._disposable = Disposable.from(...subscriptions);

        this._onEvent();
    }

    public _onEvent(){
        readFile("./readTestFile.txt").then((value)=>{
            console.log("myDEBUG:\tfile\n");
            console.log("myDEBUG\n\t"+value.replace(/\n/g, "\n\t"));
        }).catch((reason)=>{console.log(`myDEBUG:\terror: ${reason}`);});
    }

    public dispose() {
        this._statusBarItem.dispose();
        this._disposable.dispose();
    }
}

export function deactivate() {}
