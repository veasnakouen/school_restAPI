# Cloudinary Image Flow

## Product image schema

For products, store the image metadata on the owning row:

- `Products.ImageUrl` stores the Cloudinary delivery URL.
- `Products.ImagePublicId` stores the Cloudinary public ID for replace/delete operations.

This keeps the common case simple and avoids a separate media table until the app needs multi-image support or richer metadata.

## Upload flow

1. The client sends `multipart/form-data` with an image file.
2. The API validates the file type and size.
3. The file is uploaded to Cloudinary through `IPhotoService`.
4. Cloudinary returns a secure URL and public ID.
5. The API saves `ImageUrl` and `ImagePublicId` on the product.
6. If the product already had an image, the old public ID is deleted after the new image is saved.

## Delete flow

1. The API clears `ImageUrl` and `ImagePublicId` from the product.
2. The product record is saved.
3. The previous Cloudinary asset is deleted by public ID.

## Validation rules

- Allowed types: `jpg`, `jpeg`, `png`, `webp`
- Maximum size: `5 MB`
- Cloudinary transformation: `500x500`, `fill`, `face` gravity

## Recommended extension point

If the app later needs galleries, comments with attachments, or shared media across entities, add a dedicated `Photos` table with:

- `Id`
- `EntityType`
- `EntityId`
- `Url`
- `PublicId`
- `CreatedDate`

For the current product flow, the per-entity schema above is the smallest production-ready design.