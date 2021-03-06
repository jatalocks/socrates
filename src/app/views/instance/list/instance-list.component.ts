import { Component, OnInit,NgZone, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { ApiService } from '../../../services/api.service';
import {FileUploadService} from '../../../services/file-upload.service'
import { Table } from 'primeng/table';
import { PrimeNGConfig } from 'primeng/api';
import { ConfirmationService } from 'primeng/api';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-instance-list',
  templateUrl: './instance-list.component.html',
  styleUrls: ['./instance-list.component.scss'],
  providers: [MessageService,ConfirmationService]
})

export class InstanceListComponent implements OnInit {

  // fetchLastBuild(thisInstance) {
  
  //   for (let index = 0; index < thisInstance.length; index++) {
  //     const element = thisInstance[index];
  //     thisInstance[index].block_id = thisInstance[index].block._id
  //     thisInstance[index].block = thisInstance[index].block.name
  //     this.apiService.getDockerInstanceByInstanceID(element._id).subscribe(data => {
      
  //       if (data.length != 0)
  //       {
  //         thisInstance[index].numruns = data.length
  //         if (data[0].done == true)
  //         {
  //           thisInstance[index].lastrun = !data[0].error
  //         }
  //         else
  //         {
  //           thisInstance[index].lastrun =  "running"
  //         }
  //       }
  //       else
  //       {
  //         thisInstance[index].numruns = 0
  //         thisInstance[index].lastrun =  "none"
  //       }
  //   });
  //   }
  
  //   return thisInstance
  // }

  chartOptions = {
    plugins: {
      legend: {
          display: false
      }
    },
    animation: {
      duration: 0
    },
    events: [],
    tooltips: {
      enabled: false
    },
    maintainAspectRatio: false,
    scales: {
      y: {
        stacked: true,
        ticks: {
          display: false
        },
        grid: {
          display: false,
          drawBorder: false
        }
      },
      x: {
        stacked: true,
        ticks: {
          display: false
        },
        grid: {
          display: false,
          drawBorder: false
        }
      }
    }
  }

  instances: any[];

  selectedInstances: any[];

  langs: any;

  statuses: any[];

  loading: boolean = true;

  activityValues: number[] = [0, 100];

  // lastRunOptions = ['true','false','running','none']

  imageUrls = {};

  constructor(
    private apiService: ApiService,
    private uploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private messageService: MessageService,
    private actRoute: ActivatedRoute,
    private confirmationService: ConfirmationService) { }

  deleteSelectedInstances() {
    this.confirmationService.confirm({
        message: 'Are you sure you want to delete the selected products?',
        header: 'Confirm',
        icon: 'pi pi-exclamation-triangle',
        accept: () => {

            const runs = []; 
       
            this.selectedInstances.forEach(instanceToDelete=>{
              runs.push(this.apiService.deleteInstance(instanceToDelete._id.toString()).toPromise());
            });
            Promise.allSettled(runs).then(promiseResult => {
              console.log(promiseResult)
              if (promiseResult.map(res=>res.status).includes("rejected") && promiseResult.map(res=>res.status).includes("fulfilled"))
              {
                this.messageService.add({severity:'warn', summary: 'Warning', detail: 'Some Instances have Flows Attached. Deleted Unattached.', life: 3000});
              }
              if (!promiseResult.map(res=>res.status).includes("rejected"))
              {
                this.messageService.add({severity:'success', summary: 'Successful', detail: 'Instances Deleted', life: 3000});
              }
              if (!promiseResult.map(res=>res.status).includes("fulfilled"))
              {
                this.messageService.add({severity:'error', summary: 'Error', detail: 'All Instances chosen have Flows attached', life: 3000});
              }
              promiseResult.filter(res=>res.status=="fulfilled").forEach(toRemove=>{
                console.log(toRemove)
                // @ts-ignore
                if (Object.keys(toRemove).includes('msg'))
                {
                  console.log("first")
                  // @ts-ignore
                  this.instances = this.instances.filter(val => val._id!=toRemove.msg._id);
                }
                // @ts-ignore
                if (Object.keys(toRemove).includes('value'))
                {
                  console.log("second")
                  // @ts-ignore
                  this.instances = this.instances.filter(val => val._id!=toRemove.value.msg._id);
                }
              })
   
            }) 

            this.selectedInstances = null
       
        }
    });
}

  @ViewChild('dt', { static: true }) dt: any;
  ngOnInit() {
      this.apiService.getInstances().subscribe(instances => {
          this.instances = instances;
          console.log(instances)
          // this.fetchLastBuild(instances)
          this.loading = false;

          if (this.actRoute.snapshot.paramMap.get('name') != ""){
            this.dt.filters['block'] = [{value: this.actRoute.snapshot.paramMap.get('name'), matchMode: "equals", operator: "and"}];
          }

      });

      this.uploadService.getFiles().subscribe(data=>{
        data.forEach(element => {
          this.uploadService.getFileImage(element.name).subscribe(data => {
              let unsafeImageUrl = URL.createObjectURL(data);
              this.imageUrls[element.name]= this.sanitizer.bypassSecurityTrustUrl(unsafeImageUrl);
          }, error => {
              console.log(error);
          });
        });

      })
  }


}