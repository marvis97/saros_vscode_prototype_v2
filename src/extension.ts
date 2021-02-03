// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

const openDocuments = new Map<vscode.Uri, string[]>();
let lock = false;

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

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
		openDocuments.set(document.uri, document.getText().split('\n'))
	})
	/*
	context.subscriptions.push(vscode.commands.registerCommand('type', e => {
		vscode.commands.executeCommand('default:type', {
			text: e.text
		});
	}
	))*/

	context.subscriptions.push(vscode.workspace.onDidOpenTextDocument(e => readDocument(e)))
	context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(e => revertContentChange(e.contentChanges, e.document,)));
	context.subscriptions.push(disposable);

}

function readDocument(document: vscode.TextDocument): void {
	openDocuments.set(document.uri, document.getText().split('\n'))
}

function revertContentChange(editInput: readonly vscode.TextDocumentContentChangeEvent[], document: vscode.TextDocument): void {

	if (!lock) {
		editInput.forEach(change => revertChange(change, document))
	} else {
		lock = !lock
	}
	
}

async function revertChange(change: vscode.TextDocumentContentChangeEvent, document: vscode.TextDocument): Promise<boolean> {
	let we = new vscode.WorkspaceEdit()
	
	let oldText: string[] | undefined = openDocuments.get(document.uri)
	console.log(oldText)
	if (change.range.isSingleLine) {
		if (change.text != "" && change.text != "\r\n" && !change.text.includes("\r\n")) {
			//Remove new Text on rangeOffset
			let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.end.line, change.range.start.character + change.text.length))
			we.delete(document.uri, deleteRange)
			//Add old Range on rangeOffset

			if (oldText) {
				//console.log(oldText[change.range.start.line].substring(change.range.start.character,change.range.end.character))
				let insertText = oldText[change.range.start.line].substring(change.range.start.character, change.range.end.character)
				we.insert(document.uri, change.range.start, insertText)
			} else {
				//console.log("ERROR")
				return false
			}
		} else if (change.text === "") {
			if (oldText) {
				console.log(change)
				//console.log(oldText[change.range.start.line].substring(change.range.start.character,change.range.end.character))
				let insertText = oldText[change.range.start.line].substring(change.range.start.character, change.range.end.character)
				we.insert(document.uri, change.range.start, insertText)
			} else {
				//console.log("ERROR")
				return false
			}
		} else if (change.text === '\r\n') {
			let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.start.line + 1, 0))
			we.delete(document.uri, deleteRange)
		} else if (change.text.includes("\r\n")){
			let actText: string[] = change.text.split('\n')
			let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.start.line + actText.length - 1, actText[actText.length - 1].length))
			we.delete(document.uri,deleteRange)
			if (oldText) {
				//console.log(oldText[change.range.start.line].substring(change.range.start.character,change.range.end.character))
				let insertText = oldText[change.range.start.line].substring(change.range.start.character, change.range.end.character)
				we.insert(document.uri, change.range.start, insertText)
			} else {
				//console.log("ERROR")
				return false
			}
		} else {
			console.log("ERROR")
		}
	} else if (!change.range.isSingleLine) {
		if (change.text === "") {
			if (oldText) {
				let insertText = ""
				for (var i = change.range.start.line; i <= change.range.end.line; i++) {
					if (i === change.range.start.line) {
						insertText = insertText + oldText[i].substring(change.range.start.character, oldText[i].length) + "\n"
					} else if (i != change.range.start.line && i != change.range.end.line) {
						insertText = insertText + oldText[i] + "\n"
					} else if (i === change.range.end.line) {
						insertText = insertText + oldText[i].substring(0, change.range.end.character)
					}
				}
				we.insert(document.uri, change.range.start, insertText)
			}

		} else if (change.text != "" && change.text != "\r\n") {
			if (oldText) {
				let actText: string[] = change.text.split('\n')
				// new vscode.Position(Erste Zeile des neuen Textes + Anzahl der neuen Zeilen - erste Zeile, Anzahl der neuen Zeichen)
				let deleteRange = new vscode.Range(change.range.start, new vscode.Position(change.range.start.line + actText.length - 1, actText[actText.length - 1].length))
				we.delete(document.uri, deleteRange)
				let insertText = ""
				for (let i = change.range.start.line; i <= change.range.end.line; i++) {

					if (i === change.range.start.line) {
						insertText = insertText + oldText[i].substring(change.range.start.character, oldText[i].length) + "\n"
					} else if (i != change.range.start.line && i != change.range.end.line) {
						insertText = insertText + oldText[i] + "\n"
					} else if (i === change.range.end.line) {
						insertText = insertText + oldText[i].substring(0, change.range.end.character)
					}
				}
				console.log('KEKS')

				we.insert(document.uri, change.range.start, insertText)

			}

		}
	}

	lock = true;

vscode.workspace.applyEdit(we)

	if (!await changeToLSP(change, document.uri, document.getText())) {
		return false;
	}
	return true
}

async function changeToLSP(change: vscode.TextDocumentContentChangeEvent, uri: vscode.Uri, text: string): Promise<boolean> {

	await delay(100);
	changeFromLSP(change, uri, text)
	return true
}

async function changeFromLSP(change: vscode.TextDocumentContentChangeEvent, uri: vscode.Uri, text: string): Promise<boolean> {
	let we = new vscode.WorkspaceEdit()
	lock = true;
	try {
		if (change.text != "") {
			we.replace(uri, change.range, change.text)
		} else if (change.text === "") {
			we.delete(uri, change.range)
		}

	} catch {
		return false
	}
	vscode.workspace.applyEdit(we)
	openDocuments.set(uri, text.split('\n'))
	return true

}

function delay(ms: number) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

// this method is called when your extension is deactivated
export function deactivate() { }
