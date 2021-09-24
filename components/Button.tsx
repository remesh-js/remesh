import React, { ComponentPropsWithoutRef } from 'react';
import { buttonStyle } from './Button.css';

export type ButtonProps = ComponentPropsWithoutRef<'button'>;

export const Button = (props: ButtonProps) => {
  return (
    <button {...props} className={`${buttonStyle} ${props.className ?? ''}`}>
      {props.children}
    </button>
  );
};
