import { Injectable } from '@angular/core';
import { NativeAudio } from '@capacitor-community/native-audio'
import { Platform } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class AudioService {

  private audioType: string = 'html5';
  private sounds: any = [];

  constructor(platform: Platform) {
    if (platform.is('capacitor') && platform.is('ios')) {
      this.audioType = 'native';
    }
  }

  preload(key: string, asset: string) {

    if (this.audioType === 'html5') {
      const audio = {
        key: key,
        asset: asset,
        type: 'html5',
      }

      this.sounds.push(audio);
    } else {

      NativeAudio.preload({
        assetId: key,
        assetPath: asset,
        audioChannelNum: 1,
        isUrl: false
      });

      const audio = {
        key: key,
        asset: key,
        type: 'native',
      };

      this.sounds.push(audio);
    }

  }

  play(key: string) {

    const audio = this.sounds.find((sound: any) => {
      return sound.key === key;
    });

    if (audio.type === 'html5') {

      const audioAsset = new Audio(audio.asset);
      audioAsset.volume = 0.3;
      audioAsset.play();

    } else {

      NativeAudio.play({
        assetId: audio.asset,
        time: 0,
      });
    }
  }

}