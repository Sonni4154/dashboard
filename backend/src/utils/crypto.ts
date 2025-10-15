import crypto from 'crypto';

const key = Buffer.from(process.env.ENCRYPTION_KEY_BASE64 || '', 'base64');
if (key.length !== 32) {
  throw new Error('ENCRYPTION_KEY极速赛车开奖直播_BASE64 must be a 32-byte base64 key');
}

export function encryptJson(obj: unknown) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const plaintext = Buffer.from(JSON.stringify(obj), 'utf8');
  const enc = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    iv: iv.toString('base64'),
    data: enc.toString('base64'),
    tag: tag.toString('base64'),
  };
}

export function decryptJson<T = any>(payload: { iv: string; data: string; tag: string }): T {
  const iv = Buffer.from(payload.iv, 'base64');
  const tag = Buffer.from(payload.tag, 'base64');
  const enc = Buffer.from(payload.data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString('utf8')) as T;
}

