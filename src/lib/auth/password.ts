import { hash, verify } from "@node-rs/argon2";

const passwordOptions = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
};

const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=19456,t=2,p=1$/Dkg1FFasgQISGa18KULIA$6WEOxx2XcMXMN+rocSKGjVb+u658PXJwwhEkdp4Fcf0";

export async function hashPassword(password: string): Promise<string> {
  return hash(password, passwordOptions);
}

export async function verifyPassword(
  passwordHash: string,
  password: string,
): Promise<boolean> {
  try {
    return await verify(passwordHash, password);
  } catch {
    return false;
  }
}

export async function verifyDummyPassword(password: string): Promise<void> {
  try {
    await verify(DUMMY_PASSWORD_HASH, password);
  } catch {
    // The dummy verification is only used to reduce timing differences.
  }
}
