// @deprecated: ParallaxDirective non è più usato in nessun template.
// Rimuovere il file una volta rimosso dai module imports.
import { Directive } from '@angular/core';

@Directive({
  selector: '[appFade]',
  standalone: true
})
export class ParallaxDirective {
  constructor() {}
}
