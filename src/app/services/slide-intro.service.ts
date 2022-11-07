import { Injectable } from '@angular/core';
import * as Parse from 'parse';

@Injectable({
  providedIn: 'root'
})
export class SlideIntro extends Parse.Object {

  constructor() {
    super('SlideIntro');
  }

  static getInstance() {
    return this;
  }

  load(): Promise<SlideIntro[]> {

    const query = new Parse.Query(SlideIntro);
    query.equalTo('isActive', true);
    query.ascending('sort');
    query.include('place.category');

    return query.find();
  }

  get image(): Parse.File {
    return this.get('image');
  }

  get imageThumb(): Parse.File {
    return this.get('imageThumb');
  }

  get sort(): number {
    return this.get('sort');
  }

  get title(): string {
    return this.get('title');
  }

  get text(): string {
    return this.get('text');
  }

  get permission(): string {
    return this.get('permission');
  }

  toString(): string {
    return this.text;
  }
}

Parse.Object.registerSubclass('SlideIntro', SlideIntro);