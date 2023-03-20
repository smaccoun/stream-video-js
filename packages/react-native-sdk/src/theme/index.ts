import { colors } from './colors';
import { fonts } from './fonts';
import { padding } from './padding';
import { margin } from './margin';
import { Theme } from './types';
import { icon } from './icon';
import { button } from './button';
import { avatar } from './avatar';
import { spacing } from './spacing';
import { rounded } from './rounded';

const { light, dark } = colors;

export const theme: Theme = {
  light,
  dark,
  fonts,
  padding,
  margin,
  icon,
  button,
  avatar,
  spacing,
  rounded,
};
