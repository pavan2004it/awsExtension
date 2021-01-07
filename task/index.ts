import * as dotenv from 'dotenv';
dotenv.config();
import * as tl from "azure-pipelines-task-lib";
import AWS, {S3} from 'aws-sdk';
import axios, {AxiosRequestConfig} from 'axios';




async function listS3Buckets(){
    try{
        let service: string | undefined = tl.getInput('service',true)
        let token : string | undefined = tl.getInput('pat token', true)

        const encoded: string | undefined = token

        if(service){
            AWS.config = new AWS.Config()
            let auth = tl.getEndpointAuthorization(service, false)
            AWS.config.accessKeyId = auth?.parameters["username"]
            AWS.config.secretAccessKey = auth?.parameters["password"]
            console.log("Hello World")

            // Printing release variables from tfs
            // const vars = await getVariables()
            // console.log(vars)

            let s3 = new S3();
            const res = await s3.listBuckets().promise()
            getVariables(encoded)
            // console.log(tl.getVariables())

            // Printing all s3 buckets
            // res.Buckets?.forEach((bucket) =>{
            //     console.log(bucket.Name)
            // })

        }

    }catch (err){
        console.log("Error Occurred", err)
    }
}


async function getVariables(encoded: string | undefined){
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

    const ptoken: string = Buffer.from(`PAT:${encoded}`).toString('base64')


    const relConfig: AxiosRequestConfig = {
        method: 'get',
        url: 'https://eclinicaltfs.bioclinica.com/CrossProduct/Integration/_apis/release/releases/2564?api-version=5.1&Authorization=Basic BASE64PATSTRING',
        headers: {
            'Authorization': `Basic ${ptoken}`}
    }

    axios(relConfig).then(function (response){
        console.log(response.data)
    }).catch(err =>{
        console.log(err)
    })


    const config: AxiosRequestConfig = {
        method: 'get',
        url: 'https://vsrm.dev.azure.com/tfsbioclinica/Clinfeed/_apis/release/definitions/2?api-version=6.1-preview.4&Authorization=Basic BASE64PATSTRING',
        headers: {
            'Authorization': `Basic ${ptoken}`}
    };

    axios(config)
        .then(function (response) {



            const {variables, environments, name} = response.data;

            interface vars{
                [index: string] : string
            }

            let rel_vars: vars = {};
            let env_vars: vars  = {}
            for(let key in variables){
                if(variables.hasOwnProperty(key)){
                    rel_vars[key] = variables[key].value
                }

            }
            console.log(rel_vars)

            type configurationVariableValue= {
                allowOverride: boolean,
                isSecret: boolean,
                value: string
            }

            interface vars_env {
                [key: string] : configurationVariableValue
            }


            environments.forEach((env: { variables: vars_env; name: string; }) =>{
                const {variables, name} = env
                for (let key in variables){
                    if(variables.hasOwnProperty(key)){
                        env_vars[key] = variables[key].value
                    }
                }
                console.log(name)
                console.log(env_vars)
            })

        })
        .catch(function (error) {
            console.log(error);
        });
}

listS3Buckets().catch(err => console.error(err))