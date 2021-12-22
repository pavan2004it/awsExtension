// noinspection JSMismatchedCollectionQueryUpdate
// Imports
import * as tl from "azure-pipelines-task-lib";
import AWS, {ECS} from 'aws-sdk';
import {
    DescribeServicesRequest,
    RegisterTaskDefinitionRequest, Secret, UpdateServiceRequest
} from "aws-sdk/clients/ecs";
import {WaiterConfiguration} from "aws-sdk/lib/service";

// Code
async function create_task() {
    let service: string | undefined = tl.getInput('service',true)
    let auth = tl.getEndpointAuthorization(service!, false)

    AWS.config.accessKeyId = auth?.parameters["username"]
    AWS.config.secretAccessKey = auth?.parameters["password"]

    let ecs = new ECS({region:"us-east-1"})
    const container_family: string | undefined = tl.getInput('container_family', true);
    const container_name: string | undefined = tl.getInput('container_name', true);
    const container_image: string | undefined = tl.getInput('container_image', true);
    const memory_reservation: string | undefined = tl.getInput('memory_reservation', true);
    const container_port: string | undefined = tl.getInput('container_port', true);
    const host_port: string | undefined = tl.getInput('host_port', true);
    const protocol: string | undefined = tl.getInput('protocol', true);
    const pseudo: boolean | undefined = tl.getBoolInput('pseudo', true);
    const cluster_name: string | undefined = tl.getInput('cluster_name', true);
    const service_name: string | undefined = tl.getInput('service_name', true);
    const desired_count: string | undefined = tl.getInput('desired_count', true);
    const maximum_percent: string | undefined = tl.getInput('maximum_percent', true);
    const minimum_healthy: string | undefined = tl.getInput('minimum_healthy', true);
    const delay: string | undefined = tl.getInput('delay', true);
    const max_tries: string | undefined = tl.getInput('max_tries', true);
    const s3_arn: string | undefined = tl.getInput('s3_arn',true)
    const Secrets: string | undefined = tl.getInput('Secrets',false)
    const log_group: string | undefined = tl.getInput('log_group',false)
    const log_region: string | undefined = tl.getInput('log_region',false)
    const stream_prefix: string | undefined = tl.getInput('stream_prefix',false)
    const execution_role: string | undefined = tl.getInput('execution_role',false)

    let mySecArr: string[] = Secrets!.split("\n")
    let sec_arr: Secret[] = []
    mySecArr.forEach(item=>{
        sec_arr.push(JSON.parse(item))
    })

    let task_params: RegisterTaskDefinitionRequest = {
        family: container_family!,
        networkMode: "bridge",
        containerDefinitions: [{
            name: container_name!,
            image: container_image!,
            memoryReservation: Number(memory_reservation!),
            portMappings: [{
                containerPort: Number(container_port!),
                hostPort: Number(host_port!),
                protocol: protocol!
            }],
            essential: true,
            environmentFiles: [{type:"s3",value:s3_arn!}],
            pseudoTerminal: pseudo!,
            secrets:sec_arr!,
            logConfiguration: {
                logDriver: 'awslogs',
                options:{
                    'awslogs-group': log_group!,
                    'awslogs-region': log_region!,
                    'awslogs-stream-prefix':stream_prefix!
                }
            }

        }
        ],
        executionRoleArn: execution_role!
    }


    let task_res = await ecs.registerTaskDefinition(task_params).promise()


    let service_params: UpdateServiceRequest = {
        cluster: cluster_name!,
        service: service_name!,
        desiredCount: Number(desired_count!),
        taskDefinition: task_res.taskDefinition?.taskDefinitionArn,
        deploymentConfiguration: {
            maximumPercent: Number(maximum_percent!),
            minimumHealthyPercent: Number(minimum_healthy!)
        }
    }

    let update_service = await ecs.updateService(service_params).promise()

    console.log(update_service.$response)

    let wait_params: DescribeServicesRequest & WaiterConfiguration = {
        cluster: cluster_name!,
        services: [service!],
        delay: Number(delay),
        maxAttempts: Number(max_tries)
    }

    ecs.waitFor('servicesStable', wait_params)

}

create_task().catch(err => console.error(err))

