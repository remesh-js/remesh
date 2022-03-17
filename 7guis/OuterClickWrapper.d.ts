import { ComponentPropsWithoutRef } from 'react';
export declare const OuterClickWrapper: (props: OuterClickWrapperProps) => JSX.Element;
declare type OuterClickWrapperProps = ComponentPropsWithoutRef<'div'> & {
    onOuterClick?: (event: MouseEvent) => void;
};
export {};
