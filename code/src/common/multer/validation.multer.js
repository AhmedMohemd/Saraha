export const fileFieldValidation = {
    image: ['image/jpeg', 'image/jpg', 'image/png'],
    video:['video/mp4']

};
export const fileFilter = (validation = []) => {
  return function (req, file, cd) {
    if (!validation.includes(file.mimetype)) {
      return cd(
        new Error("Invalid file format", { cause: { status: 400 } }),
        false,
      );
    }
    return cd(null, true);
  };
};
