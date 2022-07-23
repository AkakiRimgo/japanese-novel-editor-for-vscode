import { TextDecoder } from 'util';
import * as vscode from 'vscode';
import {window, workspace, commands, Disposable, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument} from 'vscode';
import path = require ("path");
import { json } from 'stream/consumers';
import { isAbsolute } from 'path';

const ATTRIBUTE_TAG = {
    CHARACTER01: "キャラ",
    CHARACTER02: "人物",
    CHARACTER03: "登場人物"
};

type FileInfoDict = {
    text:string,
    error: string
};

type StoryInfoDict = {
    attribute:string
    name:string
    text: string
};

function makeStoryInfoDict(value:string[]):StoryInfoDict{
    return {
        attribute:value[0],
        name:value[1],
        text:value[2]
    };
};


async function _readFile(relativePath?:string, absolutePath?: string): Promise<FileInfoDict>{
    const _textSend = (x:string)=>{return {error:"", text:x};};
    const _errorSend = (x:string)=>{return {error:x, text:""};};

    let _fullPath:string;
    const wsFs = workspace.workspaceFolders;
    if(relativePath){
        if(wsFs && wsFs.length===1){
            _fullPath = path.join(wsFs[0].uri.path, relativePath);
        }else{
            return _errorSend("no workspaceFolders");
        }
    }else if(absolutePath){
        _fullPath = path.join(absolutePath);
    }else{
        return _errorSend("no path");
    }

    const fullPath = _fullPath;
    console.log(`myDEBUG:\t${fullPath}`);
    return workspace.fs.readFile(vscode.Uri.file(fullPath)).then(
        _uint8array=>_textSend((new TextDecoder()).decode(_uint8array)),
        reason =>_errorSend(`${reason}`)
    );
}

async function readRelativeFile(relativePath:string){
    return _readFile(relativePath,undefined);
}

async function readAbsoluteFile(absolutePath:string){
    return _readFile(undefined,absolutePath);
}

export class ReadSetting{
    constructor(){
    }

    public _onEvent(){
        const fullPath = window.activeTextEditor?.document.fileName;
        if(!fullPath) {return;}
        const dirPath = fullPath.split("/").reverse().slice(1).reverse().join("/");
        readAbsoluteFile(dirPath+"/readTestFile.txt").then(
            _dict =>{
                console.log(`myDEBUG:\t${_dict.error}`);
                console.log(`myDEBUG:\t${_dict.text}`);
                this._text2dict(_dict.text);
            }
        );
    }

    private _text2dict(s:string): StoryInfoDict[]{
        const _list = Object.values(ATTRIBUTE_TAG);
        const _sReg = _list.map(x=>`\n(${x}):(.*)\n`).join("|");
        const sReg = `\n(${_list.join('|')}):(.*)\n(.*)`;
        const reg = new RegExp(`${sReg}`,"ug");
        const ss = [...(`\n${s}`).matchAll(reg)];
        ss.forEach(value => {
            console.log("myDEBUGa:\t"+value.slice(1));
        });

        const infoDict: StoryInfoDict[] = ss.map(
            (value)=> makeStoryInfoDict(value.slice(1))
        );
        return infoDict;
    }
}