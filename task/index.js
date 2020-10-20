"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const tl = __importStar(require("azure-pipelines-task-lib"));
const aws_sdk_1 = __importStar(require("aws-sdk"));
const axios_1 = __importDefault(require("axios"));
function listS3Buckets() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            let service = tl.getInput('service', true);
            let token = tl.getInput('pat token', true);
            const encoded = token;
            if (service) {
                aws_sdk_1.default.config = new aws_sdk_1.default.Config();
                let auth = tl.getEndpointAuthorization(service, false);
                aws_sdk_1.default.config.accessKeyId = auth === null || auth === void 0 ? void 0 : auth.parameters["username"];
                aws_sdk_1.default.config.secretAccessKey = auth === null || auth === void 0 ? void 0 : auth.parameters["password"];
                // Printing release variables from tfs
                // const vars = await getVariables()
                // console.log(vars)
                let s3 = new aws_sdk_1.S3();
                const res = yield s3.listBuckets().promise();
                getVariables(encoded);
                // console.log(tl.getVariables())
                // Printing all s3 buckets
                // res.Buckets?.forEach((bucket) =>{
                //     console.log(bucket.Name)
                // })
            }
        }
        catch (err) {
            console.log("Error Occurred", err);
        }
    });
}
function getVariables(encoded) {
    return __awaiter(this, void 0, void 0, function* () {
        // const config: AxiosRequestConfig = {
        //     method: 'get',
        //     url: 'https://vsrm.dev.azure.com/tfsbioclinica/Clinfeed/_apis/release/definitions/2?api-version=6.1-preview.4&Authorization=Basic BASE64PATSTRING',
        //     headers: {
        //         'Authorization': 'Basic Ono0aXgzcGVlc21lZWd2YTV4cm1rM29hNXBubnJkbmVlNHp6YWU2YmduZWJuNG9kaXMzZmE='}
        // };
        //
        // return axios(config)
        //     .then(function (response) {
        //         const {variables} = response.data;
        //         for(let key in variables){
        //             console.log(`${key}: ${variables[key].value}`)
        //         }
        //     })
        //     .catch(function (error) {
        //         console.log(error);
        //     });
        const ptoken = Buffer.from(`PAT:${encoded}`).toString('base64');
        const relConfig = {
            method: 'get',
            url: 'https://eclinicaltfs.bioclinica.com/CrossProduct/Integration/_apis/release/releases/2564?api-version=5.1&Authorization=Basic BASE64PATSTRING',
            headers: {
                'Authorization': `Basic ${ptoken}`
            }
        };
        axios_1.default(relConfig).then(function (response) {
            console.log(response.data);
        }).catch(err => {
            console.log(err);
        });
        const config = {
            method: 'get',
            url: 'https://vsrm.dev.azure.com/tfsbioclinica/Clinfeed/_apis/release/definitions/2?api-version=6.1-preview.4&Authorization=Basic BASE64PATSTRING',
            headers: {
                'Authorization': `Basic ${ptoken}`
            }
        };
        axios_1.default(config)
            .then(function (response) {
            const { variables, environments, name } = response.data;
            let rel_vars = {};
            let env_vars = {};
            for (let key in variables) {
                if (variables.hasOwnProperty(key)) {
                    rel_vars[key] = variables[key].value;
                }
            }
            console.log(rel_vars);
            environments.forEach((env) => {
                const { variables, name } = env;
                for (let key in variables) {
                    if (variables.hasOwnProperty(key)) {
                        env_vars[key] = variables[key].value;
                    }
                }
                console.log(name);
                console.log(env_vars);
            });
        })
            .catch(function (error) {
            console.log(error);
        });
    });
}
listS3Buckets().catch(err => console.error(err));
