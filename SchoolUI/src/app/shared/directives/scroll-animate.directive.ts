import { Directive, ElementRef, Input, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[scrollAnimate]',
  standalone: true
})
export class ScrollAnimateDirective implements OnInit, OnDestroy {
  /** Delay before the enter animation starts, e.g. '100ms' or '0.2s' */
  @Input() animateDelay = '0ms';
  /** CSS animation variant class: 'fade-up' (default) | 'fade-in' | 'fade-left' | 'fade-right' */
  @Input() animateVariant: 'fade-up' | 'fade-in' | 'fade-left' | 'fade-right' = 'fade-up';

  private observer!: IntersectionObserver;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngOnInit(): void {
    const el = this.el.nativeElement;
    el.classList.add('scroll-animate', `scroll-animate--${this.animateVariant}`);
    if (this.animateDelay !== '0ms') {
      el.style.animationDelay = this.animateDelay;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('scroll-animate--visible');
            this.observer.unobserve(el);
          }
        });
      },
      { threshold: 0.08 }
    );

    this.observer.observe(el);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
