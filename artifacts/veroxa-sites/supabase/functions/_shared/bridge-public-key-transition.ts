export async function verifyExactBridgePublicKeyTransition(
  publicKeys: readonly string[],
  verify: (publicKeyBase64: string) => Promise<boolean>,
): Promise<boolean> {
  if (publicKeys.length !== 2 || publicKeys[0] === publicKeys[1]) return false;
  const results = await Promise.all(publicKeys.map(async (publicKey) => {
    try {
      return await verify(publicKey) === true;
    } catch {
      return false;
    }
  }));
  return results.filter(Boolean).length === 1;
}
