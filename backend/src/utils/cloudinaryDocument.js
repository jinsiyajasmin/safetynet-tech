const cloudinary = require("../config/cloudinary").cloudinary;

function parseCloudinaryAsset(url) {
  if (!url || !url.includes("res.cloudinary.com")) return null;

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/(image|raw|video)\/upload\/(?:v\d+\/)?(.+)$/);
    if (!match) return null;
    return {
      resource_type: match[1],
      public_id: match[2],
    };
  } catch {
    return null;
  }
}

exports.destroyCloudinaryAsset = async (url) => {
  const asset = parseCloudinaryAsset(url);
  if (!asset?.public_id) return;

  try {
    await cloudinary.uploader.destroy(asset.public_id, {
      resource_type: asset.resource_type,
      invalidate: true,
    });
  } catch (err) {
    console.error("Cloudinary delete error:", err);
  }
};
