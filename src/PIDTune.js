/* eslint-disable  no-unused-vars */
/* eslint-disable  no-empty */

'use strict';

import Path from '@/utils/path.ts';
import CSV from '@/utils/csv.ts';

const maxPTerm = 500;
const maxPTime = 4;
const maxDTerm = 0.4;
const maxITerm = 50000;

export class AxisParameters {
   constructor(letter, acceleration, maxSpeed, stepsPerMM, microstepping) {
      this.letter = letter;
      this.acceleration = acceleration;
      this.maxSpeed = maxSpeed;
      this.stepsPerMM = stepsPerMM;
      this.microstepping = microstepping;
   }

/*
G91 G1 H2 Xxx Fyyy G90
Replace X in each command by the axis that the motor is assigned to. Value xx should be calculated so that the movement is 4 full steps. yyy should be the maximum allowed by M203. We may want to allow the M203 and M201 parameters to be temporarily overridden too. I am using M201 X10000 and M203 X50000 in testing.
*/

}

export default class {
   constructor(sendCode, getFileList, downloadFile, driver, updateGraphCallback, updateAutotuneTextCallback, axisParams) {
      this.pTerm = 100;
      this.iTerm = 0;
      this.dTerm = 0;
      this.aTerm = 0;
      this.vTerm = 0;
      this.warningValue = 0;
      this.errorValue = 0;
      this.selectedDriver = driver;
      this.sendCode = sendCode;
      this.getFileList = getFileList;
      this.downloadFile = downloadFile;
      this.updateGraphCallback = updateGraphCallback;
      this.updateAutotuneStatusCallback = updateAutotuneTextCallback;
      this.cancelled = false;
      this.axisParams = axisParams;
      this.lastFile = '';
   }

   cancel() {
      this.cancelled = true;
   }

   async getPID() {
      const queryResults = await this.sendCode({ code: `M569.1 P${this.selectedDriver}`, log: false, fromInput: false });
      if (queryResults) {
         this.pTerm = Number(queryResults.match(/P=[0-9.]+/)[0].substring(2));
         this.iTerm = Number(queryResults.match(/I=[0-9.]+/)[0].substring(2));
         this.dTerm = Number(queryResults.match(/D=[0-9.]+/)[0].substring(2));
         this.aTerm = Number(queryResults.match(/A=[0-9.]+/)[0].substring(2));
         this.vTerm = Number(queryResults.match(/V=[0-9.]+/)[0].substring(2));
         
         const match = /Warning\/error threshold ([0-9.]+)\/([0-9.]+)/g.exec(queryResults);
         this.warningValue = Number(match[1]);
         this.errorValue = Number(match[2]);
      }
   }
   

   async updatePID() {
      let code = `M569.1 P${this.selectedDriver} R${this.pTerm} I${this.iTerm} D${this.dTerm} E0:0`
      await this.sendCode({ code: code, log: false });
      await this.sendCode({ code: `M569.1 P${this.selectedDriver}`, log: false });
   }

   async resetErrorThreshold() {
      await this.sendCode({ code: `M569.1 P${this.selectedDriver} E${this.warningValue}:${this.errorValue}`, log: false });
   }

   sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
   }

   async findP_Test() {
      let solved = false;
      let count = 0;

      this.pTerm = 100; //Reset P to 100 as a start point
      this.iTerm = 0;
      this.dTerm = 0;
      await this.updatePID();

      while (!solved && count < 10) {
         count++;
         let data = await this.runStepManouver();
         let processedData = this.processData(data);

         if (processedData.periods.length < 8) {
            this.pTerm += 50;
            this.iTerm = 0;
            this.dTerm = 0;
            await this.updatePID();
         } else {
            //Oscillations are too far apart
            let avg = processedData.periods.slice(1, 7).reduce((a, b) => a + b, 0) / 6;
            let under = processedData.periods.slice(1, 7).filter((period) => period < avg * 0.95);
            let over = processedData.periods.slice(1, 7).filter((period) => period > avg * 1.05);
            if (under.length > 1) {
               this.pTerm += 50;
               await this.updatePID();
            }
            //Oscillations are too close
            else if (over.length > 1) {
               this.pTerm -= 25;
               await this.updatePID();
            } else {
               solved = true;
            }
         }

         if (this.pTerm > 700) {
            return;
         }

         await this.sleep(2000);
      }
   }

   async findP() {
      let solved = false;
      let currentTarget = 0;
      this.pTerm = 10; //Reset P to 100 as a start point
      this.iTerm = 0;
      this.dTerm = 0;
      await this.updatePID();
      await this.runStepManouver();

      let peakTime = 1000;
      let repeat = 0;

      while (!solved && this.pTerm < maxPTerm) {
         if (this.cancelled) {
            return false;
         }

         this.updateStatus(`Autotune: Testing P${this.pTerm}`);
         await this.updatePID();
         let data = await this.runStepManouver();
         let processedData = this.processData(data);
         let measurement = processedData.peaks[0].time;
         if (measurement < peakTime && Math.abs(measurement - peakTime) > maxPTime) {
            peakTime = measurement;
            if(this.pTerm < 100) {
            this.pTerm += 10;
            }
            else{
               this.pTerm += 25;
            }
            currentTarget = this.pTerm;
            repeat = 0;
         } else {
            if (repeat < 1) {
               repeat++;
               if(this.pTerm < 100) {
                  this.pTerm += 10;
                  }
                  else{
                     this.pTerm += 25;
                  }
            } else {
               solved = true;
               this.pTerm = currentTarget; //Use the last term that had the most significant change
               await this.updatePID();
               this.updateStatus(`Autotune: P${this.pTerm} found`);
            }
         }
      }
      return solved;
   }

   async findD() {
      let solved = false;
      this.iTerm = 0;
      this.dTerm = 0;
      while (!solved && this.dTerm < maxDTerm) {
         if (this.cancelled) {
            return false;
         }
         await this.updatePID();
         this.updateStatus(`Autotune: Testing D${this.dTerm}`);
         let data = await this.runStepManouver();
         let processedData = this.processData(data);
         var overshoots = processedData.peaks.filter((peak) => peak.step - processedData.stepTarget > 0.05);

         if (overshoots.length > 0) {
            if(this.dTerm < 0.5) {
               this.dTerm += 0.01;
            } else{
               this.dTerm += 0.025;
            }
            
            this.dTerm = Number(this.dTerm.toPrecision(3));
         } else {
            solved = true;
         }
         await this.sleep(1000);
      }
      return solved;
   }

   async findI() {
      let solved = false;
      let count = 0;
      let stableTime = 999999;
      let currentTerm = 0;
      this.iTerm = 1000; 
      while (!solved && this.iTerm < maxITerm) {
         if (this.cancelled) {
            return false;
         }

         this.updateStatus(`Autotune: Testing I${this.iTerm}`);
         await this.updatePID();
         let data = await this.runStepManouver(true);
         let processedData = this.processData(data);
         let unstableTimes = processedData.error.filter((p) => Math.abs(p.error) > 0);
         let currentTime = unstableTimes[unstableTimes.length - 1].time; //get the last unstable time
         if (currentTime < stableTime - 25) {
            stableTime = currentTime;
            this.iTerm += 1000;
            currentTerm = this.iTerm;
            this.iTerm = Math.trunc(this.iTerm);
            count = 0;
         } else {
            count++;
            this.iTerm += 500;
            if (count > 1) {
               this.iTerm = currentTerm;
               await this.updatePID();
               solved = true;
               this.updateStatus(`Autotune: Testing I${this.iTerm}`);
            }
         }
         await this.sleep(2000);
      }
      return solved;
   }

   processData(csv) {
      let peaks = [];
      let valleys = [];
      let currentError = [];

      if (csv.measuredIndex == -1 || csv.targetIndex == -1) {
         return;
      }

      let stepTarget = 0;
      let rising = true;

      let initialOffset = csv.data.content[0][csv.measuredIndex] - csv.data.content[0][csv.targetIndex] ;

      for (let idx = 0; idx < csv.data.content.length - 1; idx++) {
         let current = csv.data.content[idx];
         current[csv.targetIndex] -= initialOffset;
         let next = csv.data.content[idx + 1];

         stepTarget = current[csv.targetIndex] > stepTarget ? current[csv.targetIndex] : stepTarget;
         if (current[csv.measuredIndex] > next[csv.measuredIndex] && rising) {
            peaks.push({ time: current[csv.timeStamp], step: current[csv.measuredIndex] });
            rising = false;
         }
         if (current[csv.measuredIndex] < next[csv.measuredIndex] && !rising) {
            valleys.push({ time: current[csv.timeStamp], step: current[csv.measuredIndex] });
            rising = true;
         }
         if (current[csv.timeStamp] > 10) {
            currentError.push({ time: Number(current[csv.timeStamp]), error: current[csv.measuredIndex] - current[csv.targetIndex] });
         }
      }

      let periods = [];
      for (let idx = 0; idx < peaks.length - 1; idx++) {
         periods.push(peaks[idx + 1].time - peaks[idx].time);
      }
      let averagePeriod = periods.reduce((a, b) => a + b, 0) / periods.length;

      let count = Math.min(peaks.length, valleys.length);
      for (let idx = 0; idx < count; idx++) {}

      return { peaks: peaks, valleys: valleys, periods: periods, averagePeriod: averagePeriod, stepTarget: stepTarget, error: currentError };
   }

   fetchCSV(csvText) {
      let csvData = new CSV(csvText);
      let timeStamp = csvData.headers.indexOf('Timestamp');
      let measuredIndex = csvData.headers.indexOf('Measured Motor Steps');
      let targetIndex = csvData.headers.indexOf('Target Motor Steps');
      return { data: csvData, timeStamp: timeStamp, measuredIndex: measuredIndex, targetIndex: targetIndex };
   }

   async runStepManouver(iTermTest = false) {
      //M569.5 P50.0 S1000 A0 R0 D6 V64
      if (this.selectedDriver == null) {
         return;
      }
      if (iTermTest) {
         await this.sendCode({ code: `M569.5 P${this.selectedDriver} S500 R250 D6 A0`, log: true });
         await this.sendCode({ code: this.generateFourFullStepsGCode(), log: true }); 
         await this.sleep(3000);
      } else {
         await this.sendCode({ code: `M569.5 P${this.selectedDriver} S1000 R2000 D6 A0`, log: true }); //Measure + Target = 6   Current Error = 8
         await this.sendCode({ code: this.generateFourFullStepsGCode(), log: true }); 
         await this.sleep(3000);
      }
      
      let files = (await this.getFileList(Path.closedLoop)).filter((file) => !file.isDirectory && file.name.endsWith('.csv')).sort((a, b) => b.lastModified - a.lastModified);
      let data = await this.downloadFile({ filename: `${Path.closedLoop}/${files[0].name}`, type: 'text', showProgress: false, showSuccess: false, showError: true });
      if (data === '') {
         throw new Error('Could not read data from CSV');
      }
      if (this.updateGraphCallback !== null) {
         this.updateGraphCallback(`Path.closedLoop}/${files[0].name}`, this.pTerm, this.iTerm, this.dTerm);
      }

      if (!files || files.length === 0  || this.lastFile === files[0].name) { 
         throw new Error('No new data found')
      }


      this.lastFile = files[0].name;

      return this.fetchCSV(data);
   }

   async execute() {
      this.cancelled = false;
      let success = true;
      await this.getPID();

      
      success = await this.findP();
      if (success) {
         success = await this.findD();
      }
      if (success) {
         success = await this.findI();
      }
           
      await this.resetErrorThreshold();

      await this.sendCode({ code: `M117 ${this.selectedDriver}: Tuning Complete `, log: true });
      this.updateStatus('');
      return true;
   }

   updateStatus(text) {
      if (this.updateAutotuneStatusCallback) {
         this.updateAutotuneStatusCallback(text);
      }
   }

   getFullStep() {
      return  1 / this.axisParams.stepsPerMM * this.axisParams.microstepping;
   }

   generateFourFullStepsGCode() {
      const gcode = `G91 G1 H2 ${this.axisParams.letter}${this.getFullStep() * -16} F${this.axisParams.maxSpeed} G90`;
      console.log(gcode);
      return gcode;
   }




}
