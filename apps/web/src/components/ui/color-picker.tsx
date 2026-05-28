import type { PopoverContentProps } from '@radix-ui/react-popover';
import {
  type HexColor,
  hexToHsva,
  type HslaColor,
  hslaToHsva,
  type HsvaColor,
  hsvaToHex,
  hsvaToHsla,
  hsvaToHslString,
  hsvaToRgba,
  type RgbaColor,
  rgbaToHsva,
} from '@uiw/color-convert';
import Hue from '@uiw/react-color-hue';
import Saturation from '@uiw/react-color-saturation';
import { ChevronDownIcon } from 'lucide-react';
import React from 'react';

import { Popover, PopoverContent, PopoverTrigger } from './popover.js';
import { cn } from '../../lib/utils.js';

function getColorAsHsva(color: `#${string}` | HsvaColor | HslaColor | RgbaColor): HsvaColor {
  if (typeof color === 'string') {
    return hexToHsva(color);
  } else if ('h' in color && 's' in color && 'v' in color) {
    return color;
  } else if ('r' in color) {
    return rgbaToHsva(color);
  } else {
    return hslaToHsva(color);
  }
}

type ColorPickerValue = {
  hex: string;
  hsl: HslaColor;
  rgb: RgbaColor;
};

type ColorPickerProps = {
  value?: `#${string}` | HsvaColor | HslaColor | RgbaColor;
  type?: 'hsl' | 'rgb' | 'hex';
  swatches?: HexColor[];
  hideContrastRatio?: boolean;
  hideDefaultSwatches?: boolean;
  className?: string;
  onValueChange?: (value: ColorPickerValue) => void;
  side?: PopoverContentProps['side'];
  align?: PopoverContentProps['align'];
  children?: React.ReactNode;
};

const DEFAULT_SWATCHES: HexColor[] = [
  '#000000', '#ffffff', '#ef4444', '#f97316', '#eab308',
  '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4',
  '#84cc16', '#f59e0b',
];

function ColorPicker({
  value,
  children,
  type = 'hex',
  swatches = [],
  hideContrastRatio = true,
  hideDefaultSwatches = false,
  onValueChange,
  className,
  side = 'bottom',
  align = 'start',
}: ColorPickerProps) {
  const [colorHsv, setColorHsv] = React.useState<HsvaColor>(
    value ? getColorAsHsva(value as any) : { h: 0, s: 0, v: 0, a: 1 }
  );
  const [hexInput, setHexInput] = React.useState(value ? hsvaToHex(getColorAsHsva(value as any)) : '#000000');

  const handleValueChange = (color: HsvaColor) => {
    setColorHsv(color);
    const hex = hsvaToHex(color);
    setHexInput(hex);
    onValueChange?.({
      hex,
      hsl: hsvaToHsla(color),
      rgb: hsvaToRgba(color),
    });
  };

  const allSwatches = hideDefaultSwatches ? swatches : [...DEFAULT_SWATCHES, ...swatches];

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children ?? (
          <button
            type="button"
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all"
            style={{
              background: 'var(--bg-elevated)',
              border: '1.5px solid var(--border)',
              color: 'var(--text-secondary)',
            }}
          >
            <div
              className="w-4 h-4 rounded"
              style={{ background: hsvaToHslString(colorHsv), border: '1px solid rgba(0,0,0,0.2)' }}
            />
            <span>{hsvaToHex(colorHsv).toUpperCase()}</span>
            <ChevronDownIcon size={12} />
          </button>
        )}
      </PopoverTrigger>
      <PopoverContent
        side={side}
        align={align}
        sideOffset={6}
        className={cn('w-[280px] p-0 rounded-2xl border-0 shadow-2xl', className)}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onPointerDown={e => e.stopPropagation()}
        onPointerMove={e => e.stopPropagation()}
        onPointerUp={e => e.stopPropagation()}
      >
        <div className="p-3 space-y-2.5">
          {/* Saturation picker */}
          <Saturation
            hsva={colorHsv}
            onChange={handleValueChange}
            style={{
              width: '100%',
              height: 'auto',
              aspectRatio: '4/2.5',
              borderRadius: '10px',
            }}
          />

          {/* Hue slider */}
          <Hue
            hue={colorHsv.h}
            onChange={(newHue) => handleValueChange({ ...colorHsv, ...newHue })}
            style={{
              width: '100%',
              height: '12px',
              borderRadius: '6px',
            } as React.CSSProperties}
          />

          {/* Hex input */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-lg flex-shrink-0"
              style={{
                background: hsvaToHslString(colorHsv),
                border: '1.5px solid var(--border)',
              }}
            />
            <input
              type="text"
              value={hexInput}
              onChange={e => {
                const v = e.target.value;
                setHexInput(v);
                if (/^#[0-9a-fA-F]{6}$/.test(v)) {
                  handleValueChange(hexToHsva(v));
                }
              }}
              className="flex-1 text-xs font-mono px-2 py-1.5 rounded-lg outline-none"
              style={{
                background: 'var(--bg-elevated)',
                border: '1.5px solid var(--border)',
                color: 'var(--text-primary)',
              }}
              placeholder="#000000"
              spellCheck={false}
            />
          </div>

          {/* Color swatches */}
          {allSwatches.length > 0 && (
            <>
              <div style={{ height: '1px', background: 'var(--border)' }} />
              <div className="grid grid-cols-6 gap-1.5">
                {allSwatches.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleValueChange(hexToHsva(color))}
                    className="w-8 h-8 rounded-lg transition-all active:scale-90"
                    style={{
                      background: color,
                      border: hsvaToHex(colorHsv) === color
                        ? '2px solid var(--accent)'
                        : '1.5px solid var(--border)',
                      transform: hsvaToHex(colorHsv) === color ? 'scale(1.12)' : undefined,
                      boxShadow: hsvaToHex(colorHsv) === color ? '0 0 0 2px var(--bg-surface)' : undefined,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { ColorPicker };
export type { ColorPickerProps, ColorPickerValue };
