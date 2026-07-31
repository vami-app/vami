import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadImage = async (fileBase64, folder) => {
  try {
    const result = await cloudinary.uploader.upload(fileBase64, {
      folder: `smalloys/${folder}`,
      resource_type: 'image',
    });
    return result;
  } catch (error) {
    throw new Error('Cloudinary upload failed');
  }
};

export const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error('Cloudinary delete failed');
  }
};

export default cloudinary;
