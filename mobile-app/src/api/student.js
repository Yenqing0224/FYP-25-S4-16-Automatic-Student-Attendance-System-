// api/student.js
export const verifyPose = async (imageUri, targetPose) => {
  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'verify.jpg',
    type: 'image/jpeg',
  });
  formData.append('pose', targetPose);

  const response = await fetch('https://face-api-923699451693.asia-southeast1.run.app/verify-pose', {
    method: 'POST',
    body: formData,
  });
  return await response.json();
};