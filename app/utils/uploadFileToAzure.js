import { BlobServiceClient } from "@azure/storage-blob";

const AZURE_STORAGE_CONNECTION_STRING =
  "DefaultEndpointsProtocol=https;AccountName=certificatedownload;AccountKey=s6BN+yog96WvmceMe4psCsIE2YOuuus9hLMWa6TRyNLycFuBCMCJksgWXSInE1eC9xn7xCebuGoR+ASt5Prp4g==;EndpointSuffix=core.windows.net";

export const uploadFileToAzure = async (container,filesInfo) => {
 return new Promise(async (resolve,reject)=>{
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    AZURE_STORAGE_CONNECTION_STRING
  );
  console.log("-----------HHHH----", container, filesInfo);

  const containerName = container.toLowerCase();
  let containerClient = await blobServiceClient.getContainerClient(
    containerName
  );
  let isContainerExits = await containerClient.exists();
  console.log("-----------exists---",isContainerExits);

  if (!isContainerExits) {
    await blobServiceClient.createContainer(containerName);
    // console.log("------container--created---------");
  }
  containerClient = await blobServiceClient.getContainerClient(containerName);

  let urlList = [];

  const blockBlobClient = containerClient.getBlockBlobClient(`${filesInfo.filename}`);
  const uploadBlobResponse = await blockBlobClient.uploadFile(filesInfo.path);
  console.log(
    "Blob was uploaded successfully. requestId: ",
    uploadBlobResponse.requestId
  );

 resolve({url:blockBlobClient.url})

 })
};
