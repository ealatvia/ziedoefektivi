import { validateIdCode } from "@/utils/local";
import TextInput from "./TextInput";

export default function IdCodeInput({
  idCodeText,
  idCodeDescription,
  idCode,
  setIdCode,
  setValidity,
}) {
  return (
    <TextInput
      name="idCode"
      value={idCode}
      setValue={setIdCode}
      setValidity={setValidity}
      isValid={(value) => validateIdCode(value)}
      label={idCodeText}
      autoComplete="isikukood"
      maxLength={12}
      description={idCodeDescription}
    />
  );
}
