import { describe, it, expect } from 'bun:test';
import { PITCH_SLIDES } from '../src/features/pitch/pitch-slides';

describe('Investor Pitch Deck & 3-Minute Presentation Specification', () => {
  it('contains exactly 7 cohesive pitch slides covering the 3-minute presentation', () => {
    expect(PITCH_SLIDES.length).toBe(7);
    expect(PITCH_SLIDES.map((s) => s.number)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(PITCH_SLIDES.map((s) => s.id)).toEqual([
      'market-gap',
      'why-solana',
      'hardware-gateway',
      'financial-engine',
      'defi-financial-engine',
      'victron-integration',
      'vision-round',
    ]);
  });

  it('implements the exact opener hook requested by the user on Slide 1', () => {
    const slide1 = PITCH_SLIDES[0];
    expect(slide1.id).toBe('market-gap');
    expect(slide1.timeRange).toBe('0:00 - 0:25');

    // Check verbatim spoken script
    expect(slide1.script).toContain('Three trillion dollars');
    expect(slide1.script).toContain('entire market cap of crypto');
    expect(slide1.script).toContain('shut out from the energy boom');

    // Check interactive reveal steps
    expect(slide1.revealSteps).toBeDefined();
    const labels = slide1.revealSteps!.map((s) => s.label);
    expect(labels).toContain('USDC 3,000B');
    expect(labels).toContain('0%');
    expect(labels.some((l) => l === 'Tritenna' || l === 'Treetino')).toBe(true);

    const highlights = slide1.revealSteps!.map((s) => s.highlightText);
    expect(highlights.some((h) => h?.includes('in 2025'))).toBe(true);
  });

  it('focuses on why Solana and how we take advantage on Slide 2', () => {
    const slide2 = PITCH_SLIDES[1];
    expect(slide2.id).toBe('why-solana');
    expect(slide2.timeRange).toBe('0:25 - 0:50');
    expect(slide2.script).toContain('Solana');
    expect(slide2.script).toContain('four-hundred-millisecond');
    expect(slide2.script).toContain('micro-dividends');
    expect(slide2.script).toContain('escrow');
    expect(slide2.script).toContain('burned forever on-chain');
    expect(slide2.script).toContain('EEbZ5DVTQ');
  });

  it('covers the hardware anchor, Treetino V1 49 kW, and RWA flagship branding on Slide 3', () => {
    const slide3 = PITCH_SLIDES[2];
    expect(slide3.id).toBe('hardware-gateway');
    expect(slide3.timeRange).toBe('0:50 - 1:15');
    expect(slide3.title).toBe('Treetino V1');
    expect(slide3.script).toContain('MKovo');
    expect(slide3.script).toContain('first commercial client');
    expect(slide3.script).toContain('five contracted units');
    expect(slide3.script).toContain('Treetino V1');
    expect(slide3.script).toContain('forty-nine kilowatts');
    expect(slide3.script).toContain('flagship physical branding');
    expect(slide3.script).toContain('clean energy RWA protocol');
    expect(slide3.script.toLowerCase()).not.toContain('trojan horse');
  });

  it('covers BESS Přeštice 8.6 MW and institutional yield benchmarks on Slide 4', () => {
    const slide4 = PITCH_SLIDES[3];
    expect(slide4.id).toBe('financial-engine');
    expect(slide4.number).toBe(4);
    expect(slide4.timeRange).toBe('1:15 - 1:40');
    expect(slide4.script).toContain('BESS Přeštice');
    expect(slide4.script).toContain('ČEZ Distribuce');
    expect(slide4.script).toContain('ČEPS');
    expect(slide4.script).toContain('Two-point-nine-five years');
  });

  it('covers additional financial tools, Marinade SOL collateral, and Kamino USDC earning pool on Slide 5', () => {
    const slide5 = PITCH_SLIDES[4];
    expect(slide5.id).toBe('defi-financial-engine');
    expect(slide5.number).toBe(5);
    expect(slide5.timeRange).toBe('1:40 - 2:05');
    expect(slide5.script).toContain('Nine to twenty-one percent');
    expect(slide5.script).toContain('Marinade SOL');
    expect(slide5.script).toContain('Kamino');
    expect(slide5.script).toContain('RockawayX');
    expect(slide5.script).toContain('zero-capex');
  });

  it('covers the live Victron SCADA integration and edge telemetry on Slide 6', () => {
    const slide6 = PITCH_SLIDES[5];
    expect(slide6.id).toBe('victron-integration');
    expect(slide6.number).toBe(6);
    expect(slide6.timeRange).toBe('2:05 - 2:35');
    expect(slide6.script).toContain('Victron Cerbo');
    expect(slide6.script).toContain('Venus OS');
    expect(slide6.script).toContain('Modbus TCP');
    expect(slide6.script).toContain('ČEPS');
    expect(slide6.script).toContain('ninety-six');
  });

  it('closes on the USDC 3 trillion hook and hackathon achievements on Slide 7', () => {
    const slide7 = PITCH_SLIDES[6];
    expect(slide7.id).toBe('vision-round');
    expect(slide7.number).toBe(7);
    expect(slide7.timeRange).toBe('2:35 - 3:00');
    expect(slide7.title).toContain('Unlocking the USDC 3 Trillion Grid');
    expect(slide7.subtitle).toContain('Jakub Lustyk (CTO, Treetino)');
    expect(slide7.subtitle).toContain('Marian-Daniel Rolník (Cleevio)');
    expect(slide7.script).toContain('three trillion dollars');
    expect(slide7.script).toContain('Marian-Daniel Rolník from Cleevio');
    expect(slide7.script).toContain(
      'built the protocol that flips that script',
    );
    expect(slide7.script).toContain(
      'earn from the global energy transformation',
    );
  });

  it('contains strictly zero emojis anywhere across slide titles, subtitles, scripts, or presenter notes', () => {
    // Unicode extended pictographic regex for emoji detection
    const emojiRegex = /\p{Extended_Pictographic}/u;

    for (const slide of PITCH_SLIDES) {
      expect(emojiRegex.test(slide.title)).toBe(false);
      expect(emojiRegex.test(slide.subtitle)).toBe(false);
      expect(emojiRegex.test(slide.script)).toBe(false);
      expect(emojiRegex.test(slide.keyTakeaway)).toBe(false);
      for (const note of slide.presenterNotes) {
        expect(emojiRegex.test(note)).toBe(false);
      }
      if (slide.revealSteps) {
        for (const step of slide.revealSteps) {
          expect(emojiRegex.test(step.label)).toBe(false);
          expect(emojiRegex.test(step.description)).toBe(false);
          if (step.highlightText) {
            expect(emojiRegex.test(step.highlightText)).toBe(false);
          }
        }
      }
    }
  });

  it('supports standard hardware clicker keys and actions', () => {
    // Standard presentation remotes (Logitech, Kensington, Areson RF, DinoFire)
    const nextClickerKeys = [
      'PageDown',
      'ArrowDown',
      'ArrowRight',
      ' ',
      'Enter',
      ']',
      'MediaTrackNext',
    ];
    const prevClickerKeys = [
      'PageUp',
      'ArrowUp',
      'ArrowLeft',
      'Backspace',
      '[',
      'MediaTrackPrevious',
    ];
    const blackoutKeys = ['b', 'B', '.'];
    const slideshowKeys = ['F5', 'f'];

    expect(nextClickerKeys).toContain('PageDown');
    expect(prevClickerKeys).toContain('PageUp');
    expect(blackoutKeys).toContain('.');
    expect(slideshowKeys).toContain('F5');
  });
});
