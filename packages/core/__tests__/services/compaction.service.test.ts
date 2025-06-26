import { CompactionService } from '../../src/services/compaction.service';

describe('CompactionService', () => {
  let service: CompactionService;

  beforeEach(() => {
    service = new CompactionService();
  });

  describe('protectContent', () => {
    it('should protect strings with double quotes', () => {
      const input = 'const str = "hello world";';
      const protectedText = service['protectContent'](input);
      expect(protectedText).toContain('__PROTECTED_3_0__');
      expect(protectedText).not.toContain('hello world');
    });

    it('should protect template literals', () => {
      const input = 'const str = `hello ${name}`;';
      const protectedText = service['protectContent'](input);
      expect(protectedText).toContain('__PROTECTED_5_0__');
      expect(protectedText).not.toContain('`hello ${name}`');
    });

    it('should protect regex literals', () => {
      const input = 'const regex = /[a-z]+/g;';
      const protectedText = service['protectContent'](input);
      expect(protectedText).toContain('__PROTECTED_6_0__');
      expect(protectedText).not.toContain('/[a-z]+/g');
    });
  });

  describe('restoreContent', () => {
    it('should restore protected content correctly', () => {
      const original = 'const str = "hello";';
      const protectedText = service['protectContent'](original);
      const restoredText = service['restoreContent'](protectedText);
      expect(restoredText).toBe(original);
    });

    it('should handle multiple protected sections', () => {
      const original = 'const str1 = "hello"; const str2 = `world`;';
      const protectedText = service['protectContent'](original);
      const restoredText = service['restoreContent'](protectedText);
      expect(restoredText).toBe(original);
    });
  });

  describe('applyStandardCompression', () => {
    it('should remove comments', () => {
      const input = `// Comment\nconst x = 1; /* another comment */`;
      const result = service['applyStandardCompression'](input);
      expect(result).toBe('const x=1;');
    });

    it('should normalize whitespace', () => {
      const input = 'const  x  =  1  +  2;';
      const result = service['applyStandardCompression'](input);
      expect(result).toBe('const x=1+2;');
    });

    it('should preserve string content', () => {
      const input = 'const str = "hello  world";';
      const result = service['applyStandardCompression'](input);
      expect(result).toBe('const str="hello  world";');
    });
  });

  describe('applyExtremeCompression', () => {
    it('should compress to a single line when possible', () => {
      const input = `const x = 1;\nconst y = 2;`;
      const result = service['applyExtremeCompression'](input);
      expect(result).toBe('const x=1;const y=2;');
    });

    it('should preserve newlines after opening delimiters', () => {
      const input = 'if (true) {\n  console.log(1);\n}';
      const result = service['applyExtremeCompression'](input);
      expect(result).toContain('if(true){');
      expect(result).toContain('\n}');
    });
  });

  describe('compress', () => {
    it('should return original text when level is none', () => {
      const input = 'const x = 1;';
      const result = service.compress(input, 'none');
      expect(result).toBe(input);
    });

    it('should apply standard compression', () => {
      const input = 'const x = 1; // comment';
      const result = service.compress(input, 'standard');
      expect(result).toBe('const x=1;');
    });

    it('should apply extreme compression', () => {
      const input = 'const x = 1;\nconst y = 2;';
      const result = service.compress(input, 'extreme');
      expect(result).toBe('const x=1;const y=2;');
    });

    it('should handle empty input', () => {
      expect(service.compress('', 'standard')).toBe('');
      expect(service.compress(null as any, 'standard')).toBe('');
      expect(service.compress(undefined as any, 'standard')).toBe('');
    });
  });
});
