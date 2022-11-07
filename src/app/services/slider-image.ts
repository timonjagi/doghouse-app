import { Injectable } from '@angular/core';
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class Slide extends Parse.Object {

  constructor() {
    super('SliderImage');
  }

  static getInstance() {
    return this;
  }

  load(params: any = {}): Promise<Slide[]> {
    const query = new Parse.Query(Slide);
    query.equalTo('isActive', true);

    if (params.page) {
      query.equalTo('page', params.page);
    }

    query.ascending('sort');
    query.include('category', 'place', 'post');

    return query.find();
  }

  get image(): any {
    return this.get('image');
  }

  get sort(): number {
    return this.get('sort');
  }

  get url(): string {
    return this.get('url');
  }

  get place(): any {
    return this.get('place');
  }

  get post(): any {
    return this.get('post');
  }

  get category(): any {
    return this.get('category');
  }

  get type(): any {
    return this.get('type');
  }

  get isActive(): boolean {
    return this.get('isActive');
  }

  get page(): string {
    return this.get('page');
  }

  get position(): string {
    return this.get('position');
  }

  toString(): string {
    return this.image.url();
  }
}

Parse.Object.registerSubclass('SliderImage', Slide);