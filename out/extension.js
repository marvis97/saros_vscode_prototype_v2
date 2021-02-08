"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const openDocuments = new Map();
let lock = false;
let changeQueue = [];
let pendingChanges = [];
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    const edit = Array;
    // Use the console to output diagnostic information (console.log) and errors (console.error)
    // This line of code will only be executed once when your extension is activated
    console.log('Congratulations, your extension "SVP2" is now active!');
    // The command has been defined in the package.json file
    // Now provide the implementation of the command with registerCommand
    // The commandId parameter must match the command field in package.json
    let disposable = vscode.commands.registerCommand('SVP2.helloWorld', () => {
        // The code you place here will be executed every time your command is executed
        // Display a message box to the user
        vscode.window.showInformationMessage('Aktiviert!');
    });
    vscode.workspace.textDocuments.forEach(document => {
        openDocuments.set(document.uri, document.getText().split('\n'));
    });
    /*
    context.subscriptions.push(vscode.commands.registerCommand('type', e => {
        vscode.commands.executeCommand('default:type', {
            text: e.text
        });
    }
    ))*/
    context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(e => readDocument(e)));
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => addToQueue(e.contentChanges, e.document)));
    context.subscriptions.push(disposable);
}
exports.activate = activate;
function isPendingChange(change) {
    let index = pendingChanges.find(ch => ch[0].start.line === change.range.start.line && ch[0].start.character === change.range.start.character && ch[0].end.line === change.range.end.line && ch[0].end.character === change.range.end.character && ch[1] === change.text);
    if (index) {
        pendingChanges.splice(pendingChanges.indexOf(index), 1);
        return true;
    }
    else {
        return false;
    }
}
function addToQueue(editInput, document) {
    return __awaiter(this, void 0, void 0, function* () {
        // Funktion müsste gelockt werden, um auch in extrem seltenen Fällen eine Abarbeitung der Events in der richtigen Reihenfolge zu garantieren
        if (editInput.length !== 0) {
            if (changeQueue.length !== 0) {
                editInput.forEach(change => {
                    if (!isPendingChange(change))
                        changeQueue.push([change, document]);
                });
            }
            else {
                editInput.forEach(change => {
                    if (!isPendingChange(change))
                        changeQueue.push([change, document]);
                });
                revertChange();
            }
        }
    });
}
function readDocument(document) {
    openDocuments.set(document.uri, document.getText().split('\n'));
}
/*
function revertContentChange(editInput: readonly vscode.TextDocumentContentChangeEvent[], document: vscode.TextDocument): void {

    if (!lock) {
        editInput.forEach(change => revertChange(change, document))
    } else {
        lock = !lock
    }
    
}
*/
//async function revertChange(change: vscode.TextDocumentContentChangeEvent, document: vscode.TextDocument): Promise<boolean> {
function revertChange() {
    return __awaiter(this, void 0, void 0, function* () {
        if (changeQueue.length === 0)
            return true;
        let change = changeQueue[0][0];
        let document = changeQueue[0][1];
        let we = new vscode.WorkspaceEdit();
        let oldText = openDocuments.get(document.uri);
        console.log(oldText);
        if (change.range.isSingleLine) {
            if (change.text !== "" && change.text !== "\r\n" && !change.text.includes("\r\n")) {
                //Remove new Text on rangeOffset
                let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.end.line, change.range.start.character + change.text.length));
                we.delete(document.uri, deleteRange);
                pendingChanges.push([deleteRange, ""]);
                //Add old Range on rangeOffset
                if (oldText) {
                    //console.log(oldText[change.range.start.line].substring(change.range.start.character,change.range.end.character))
                    let insertText = oldText[change.range.start.line].substring(change.range.start.character, change.range.end.character);
                    if (insertText !== "") {
                        we.insert(document.uri, change.range.start, insertText);
                        pendingChanges.push([new vscode.Range(change.range.start, change.range.start), insertText]);
                    }
                }
                else {
                    //console.log("ERROR")
                    return false;
                }
            }
            else if (change.text === "") {
                if (oldText) {
                    console.log(change);
                    //console.log(oldText[change.range.start.line].substring(change.range.start.character,change.range.end.character))
                    let insertText = oldText[change.range.start.line].substring(change.range.start.character, change.range.end.character);
                    we.insert(document.uri, change.range.start, insertText);
                    pendingChanges.push([new vscode.Range(change.range.start, change.range.start), insertText]);
                }
                else {
                    //console.log("ERROR")
                    return false;
                }
            }
            else if (change.text === '\r\n') {
                let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.start.line + 1, 0));
                we.delete(document.uri, deleteRange);
                pendingChanges.push([deleteRange, ""]);
            }
            else if (change.text.includes("\r\n")) {
                let actText = change.text.split('\n');
                let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.start.line + actText.length - 1, actText[actText.length - 1].length));
                we.delete(document.uri, deleteRange);
                pendingChanges.push([deleteRange, ""]);
                if (oldText) {
                    //console.log(oldText[change.range.start.line].substring(change.range.start.character,change.range.end.character))
                    let insertText = oldText[change.range.start.line].substring(change.range.start.character, change.range.end.character);
                    if (insertText !== "") {
                        we.insert(document.uri, change.range.start, insertText);
                        pendingChanges.push([new vscode.Range(change.range.start, change.range.start), insertText]);
                    }
                }
                else {
                    //console.log("ERROR")
                    return false;
                }
            }
            else {
                console.log("ERROR");
            }
        }
        else if (!change.range.isSingleLine) {
            if (change.text === "") {
                if (oldText) {
                    let insertText = "";
                    for (var i = change.range.start.line; i <= change.range.end.line; i++) {
                        if (i === change.range.start.line) {
                            insertText = insertText + oldText[i].substring(change.range.start.character, oldText[i].length) + "\n";
                        }
                        else if (i !== change.range.start.line && i !== change.range.end.line) {
                            insertText = insertText + oldText[i] + "\n";
                        }
                        else if (i === change.range.end.line) {
                            insertText = insertText + oldText[i].substring(0, change.range.end.character);
                        }
                    }
                    we.insert(document.uri, change.range.start, insertText);
                    pendingChanges.push([new vscode.Range(change.range.start, change.range.start), insertText]);
                }
            }
            else if (change.text !== "" && change.text !== "\r\n") {
                if (oldText) {
                    let actText = change.text.split('\n');
                    // new vscode.Position(Erste Zeile des neuen Textes + Anzahl der neuen Zeilen - erste Zeile, Anzahl der neuen Zeichen)
                    let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.start.line + actText.length - 1, actText[actText.length - 1].length));
                    we.delete(document.uri, deleteRange);
                    pendingChanges.push([deleteRange, ""]);
                    let insertText = "";
                    for (let i = change.range.start.line; i <= change.range.end.line; i++) {
                        if (i === change.range.start.line) {
                            insertText = insertText + oldText[i].substring(change.range.start.character, oldText[i].length) + "\n";
                        }
                        else if (i !== change.range.start.line && i !== change.range.end.line) {
                            insertText = insertText + oldText[i] + "\n";
                        }
                        else if (i === change.range.end.line) {
                            insertText = insertText + oldText[i].substring(0, change.range.end.character);
                        }
                    }
                    console.log('KEKS');
                    if (insertText !== "") {
                        we.insert(document.uri, change.range.start, insertText);
                        pendingChanges.push([new vscode.Range(change.range.start, change.range.start), insertText]);
                    }
                }
            }
        }
        lock = true;
        vscode.workspace.applyEdit(we);
        if (!(yield changeToLSP(change, document.uri, document.getText()))) {
            return false;
        }
        changeQueue.splice(0, 1);
        if (changeQueue.length === 0) {
            return true;
        }
        revertChange();
        return true;
    });
}
function changeToLSP(change, uri, text) {
    return __awaiter(this, void 0, void 0, function* () {
        yield delay(10);
        changeFromLSP(change, uri, text);
        return true;
    });
}
function changeFromLSP(change, uri, text) {
    return __awaiter(this, void 0, void 0, function* () {
        let we = new vscode.WorkspaceEdit();
        lock = true;
        try {
            if (change.text !== "") {
                we.replace(uri, change.range, change.text);
                pendingChanges.push([change.range, change.text]);
            }
            else if (change.text === "") {
                we.delete(uri, change.range);
                pendingChanges.push([change.range, ""]);
            }
        }
        catch (_a) {
            return false;
        }
        vscode.workspace.applyEdit(we);
        openDocuments.set(uri, text.split('\n'));
        return true;
    });
}
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map