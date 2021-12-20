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
Object.defineProperty(exports, "__esModule", { value: true });
const tl = __importStar(require("azure-pipelines-task-lib"));
const aws_sdk_1 = __importStar(require("aws-sdk"));
function create_task() {
    var _a;
    return __awaiter(this, void 0, void 0, function* () {
        let service = tl.getInput('service', true);
        let auth = tl.getEndpointAuthorization(service, false);
        aws_sdk_1.default.config.accessKeyId = auth === null || auth === void 0 ? void 0 : auth.parameters["username"];
        aws_sdk_1.default.config.secretAccessKey = auth === null || auth === void 0 ? void 0 : auth.parameters["password"];
        let ecs = new aws_sdk_1.ECS({ region: "us-east-1" });
        const container_family = tl.getInput('container_family', true);
        const container_name = tl.getInput('container_name', true);
        const container_image = tl.getInput('container_image', true);
        const memory_reservation = tl.getInput('memory_reservation', true);
        const container_port = tl.getInput('container_port', true);
        const host_port = tl.getInput('host_port', true);
        const protocol = tl.getInput('protocol', true);
        const pseudo = tl.getBoolInput('pseudo', true);
        const cluster_name = tl.getInput('cluster_name', true);
        const service_name = tl.getInput('service_name', true);
        const desired_count = tl.getInput('desired_count', true);
        const maximum_percent = tl.getInput('maximum_percent', true);
        const minimum_healthy = tl.getInput('minimum_healthy', true);
        const delay = tl.getInput('delay', true);
        const max_tries = tl.getInput('max_tries', true);
        const s3_arn = tl.getInput('s3_arn', true);
        const Secrets = tl.getInput('Secrets', false);
        let mySecArr = Secrets.split("\n");
        let sec_arr = [];
        mySecArr.forEach(item => {
            sec_arr.push(JSON.parse(item));
        });
        let task_params = {
            family: container_family,
            networkMode: "bridge",
            containerDefinitions: [{
                    name: container_name,
                    image: container_image,
                    memoryReservation: Number(memory_reservation),
                    portMappings: [{
                            containerPort: Number(container_port),
                            hostPort: Number(host_port),
                            protocol: protocol
                        }],
                    essential: true,
                    environmentFiles: [{ type: "s3", value: s3_arn }],
                    pseudoTerminal: pseudo,
                    secrets: sec_arr
                }
            ],
        };
        let task_res = yield ecs.registerTaskDefinition(task_params).promise();
        let service_params = {
            cluster: cluster_name,
            service: service_name,
            desiredCount: Number(desired_count),
            taskDefinition: (_a = task_res.taskDefinition) === null || _a === void 0 ? void 0 : _a.taskDefinitionArn,
            deploymentConfiguration: {
                maximumPercent: Number(maximum_percent),
                minimumHealthyPercent: Number(minimum_healthy)
            }
        };
        let update_service = yield ecs.updateService(service_params).promise();
        console.log(update_service.$response);
        let wait_params = {
            cluster: cluster_name,
            services: [service],
            delay: Number(delay),
            maxAttempts: Number(max_tries)
        };
        ecs.waitFor('servicesStable', wait_params);
    });
}
create_task().catch(err => console.error(err));
