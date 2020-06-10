// core
import { exists, readJson, writeJson } from 'https://deno.land/std/fs/mod.ts';
// imports
import { sha1 } from 'https://denopkg.com/chiefbiiko/sha1/mod.ts';
// models
import { IAnswer } from './model.ts';

const TOKEN = '';
const PATH = './data/answer.json';
const GET_API = `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${TOKEN}}`;
const POST_API = `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${TOKEN}`;

async function run(): Promise<void> {
    const data = await loadData(PATH, GET_API);
    data.decifrado = decrypt(data);
    data.resumo_criptografico = sha1(data.decifrado, "utf8", "hex") as string;
    const result = await sendData(POST_API, data);
    console.log(await result.json());
}

async function loadData(path: string, api: string): Promise<IAnswer> {
    const fileExists = await exists(path);
    const data = fileExists ? await loadFromPath(path) : await loadFromAPI(api);
    if (!fileExists) { await writeJson(path, data); }
    return data as IAnswer;
}

async function loadFromPath(path: string): Promise<IAnswer> {
    const data = await readJson(path);
    return data as IAnswer;
}

async function loadFromAPI(api: string): Promise<IAnswer> {
    const res = await fetch(api);
    const data = await res.json();
    return data as IAnswer;
}

function decrypt({ cifrado, numero_casas }: IAnswer): string {
    const aCharCode = "a".charCodeAt(0);
    const zCharCode = "z".charCodeAt(0);
    const alphabetRange = zCharCode - aCharCode;

    const isLetter = (letterCode: number) => letterCode >= aCharCode && letterCode <= zCharCode;

    const decryptChar = (char: string) => {
        const encryptedCharCode = char.charCodeAt(0);
        let decryptedCharCode = encryptedCharCode;

        if (isLetter(encryptedCharCode)) {
            decryptedCharCode -= numero_casas;

            if (decryptedCharCode > zCharCode) {
                decryptedCharCode -= alphabetRange;
            } else if (decryptedCharCode < aCharCode) {
                decryptedCharCode += alphabetRange;
            }
        }

        return String.fromCharCode(decryptedCharCode);
    };

    const decrypted = cifrado
        .split('')
        .map(char => decryptChar(char))
        .join('');

    return decrypted;
}

async function sendData(api: string, data: IAnswer): Promise<Response> {
    const form = new FormData();
    form.append("answer", new Blob([JSON.stringify(data)]));

    const response = await fetch(api, {
        method: "POST",
        body: form
    });
    return response;
}

run();
