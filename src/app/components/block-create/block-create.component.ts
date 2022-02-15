import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../service/api.service';
import { Component, OnInit, NgZone, ViewEncapsulation,ViewChild } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { FormArray } from '@angular/forms';
import { CdkDragDrop, copyArrayItem, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-block-create',
  templateUrl: './block-create.component.html',
  styleUrls: ['./block-create.component.css'],
  encapsulation: ViewEncapsulation.None
})

export class BlockCreateComponent implements OnInit {  
  
  prescript_enabled = false;
  isLinear = false;
  flowForm: FormGroup;
  array = [];
  steps: any = [[]];
  id: any = "";
  sum = 15;
  data: any;
  throttle = 300;
  scrollDistance = 1.5;
  scrollUpDistance = 2;
  direction = "";


  @ViewChild('CodeMirror') private cm: any;
  submitted = false;
  blockForm: FormGroup;
  parameters: FormArray;

  Language: String[] = []
  title = "New Block"
  shared: FormArray;

  constructor(
    public fb: FormBuilder,
    private router: Router,
    private ngZone: NgZone,
    private apiService: ApiService,
    private actRoute: ActivatedRoute
  ) { 
   
    
  }

  sharedParams: any = [];

  drop(event: CdkDragDrop<Object[]>) {
    let item = Object(event.previousContainer.data[event.previousIndex])
    this.shared = this.blockForm.get('shared') as FormArray;
    let valid = true
    this.shared.value.forEach((x, i) => {
      if (x.key == item.key) valid = false;
    });
    if (valid)
    {
      this.shared.push(this.fb.group({
        key: item.key,
        value: item.value,
        secret: item.secret,
      }));
    }


   
    // copyArrayItem(this.sharedParams,this.blockForm.get('shared').value,event.previousIndex,event.currentIndex)
    // moveItemInArray(this.sharedParams, event.previousIndex, event.currentIndex);
  }

  ngAfterViewChecked(){
    for (let index = 0; index < this.blockForm.get('shared').value.length; index++) {
      this.togglePass(index+"shared",this.blockForm.get('shared').value[index].secret)
    }
  }

  ngOnInit() { 
    
      this.appendItems(0, this.sum);
   
    this.mainForm();
    this.id = this.actRoute.snapshot.paramMap.get('id')
    if (this.id == ""){
      console.log("New Flow")
    }
    else
    {
      console.log("Populate Flow")
      this.apiService.getBlock(this.id).subscribe(data => {
        delete data.__v
        delete data._id
        console.log(data)

        this.blockForm.get('prescript').setValue(data.prescript)
        this.blockForm.get('name').setValue(data.name)
        this.blockForm.get('script').setValue(data.script)
        
        this.blockForm.get('desc').setValue(data.desc)
        this.blockForm.get('lang').setValue(data.lang)
        this.shared = this.blockForm.get('shared') as FormArray;
        data.shared.forEach(item=>{
          console.log(item)
          this.shared.push(this.fb.group({
            key: item.key,
            value: item.value,
            secret: item.secret,
            _id: item._id
          }));
        });
        this.blockForm.get('parameters').setValue(data.parameters)
      });
    }
  //  this.apiService.getLangs().subscribe(
  //     (res) => {
  //       res = JSON.parse(res.toString())
  //       for (let key in res) {
  //         let value = res[key];
  //         console.log(value["ProgrammingLanguage"])

  //       }
  //     }, (error) => {
  //       console.log(error);
  //     })
  this.apiService.getSettings().subscribe(data=>{

      data[0]["langs"].forEach(element => {
        this.Language.push(element["lang"])
      });
    });
  }
  togglePass(i,checkbox) {
    if (checkbox)
    {
      document.getElementById(i).setAttribute("type","password");
    }
    else
    {
      document.getElementById(i).setAttribute("type","text");
    }
  }



  addItems(startIndex, endIndex, _method) {

    this.apiService.getParameters().subscribe(data=>{
      this.data=data
      for (let i = startIndex; i < endIndex && i < this.data.length; ++i) {
        this.sharedParams[_method](data[i]);
       
      }
    })

    
  }

  appendItems(startIndex, endIndex) {
    this.addItems(startIndex, endIndex, "push");
  }

  prependItems(startIndex, endIndex) {
    this.addItems(startIndex, endIndex, "unshift");
  }

  onScrollDown(ev) {
    // add another 20 items
    const start = this.sum;
    this.sum += 15;
    this.appendItems(start, this.sum);

    this.direction = "down";
  }

  onUp(ev) {
    // const start = this.sum;
    // this.sum += 20;
    // this.prependItems(start, this.sum);
    // this.direction = "up";
  }

  mainForm() {
    this.blockForm = this.fb.group({
      name: ['', [Validators.required]],
      //email: ['', [Validators.required, Validators.pattern('[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,3}$')]],
      parameters: this.fb.array([
        this.createItem()
      ]),
      shared: this.fb.array([
      ]),
      script: ['You Can Drag and Drop a Text File Here', [Validators.required]],
      prescript: ['false',this.prescript_enabled],
      desc: [''],
      lang: ['', [Validators.required]]
    })
  }

  // Choose designation with select dropdown
  // updateProfile(e){
  //   this.blockForm.get('designation').setValue(e, {
  //     onlySelf: true
  //   })
  // }

  // Getter to access form control
  get myForm(){
    return this.blockForm.controls;
  }

  createItem(): FormGroup {
    return this.fb.group({
      key: '',
      value: '',
      secret: false,
    });
  }
  addItem(): void {
    this.parameters = this.blockForm.get('parameters') as FormArray;
    this.parameters.push(this.createItem());
  }
  addItemShared(): void {
    this.shared = this.blockForm.get('shared') as FormArray;
    this.shared.push(this.createItem());
  }
  removeItem(index): void {
    this.parameters.removeAt(index)
    
  }
  removeItemShared(index): void {
    this.shared.removeAt(index)
    
  }

  onSubmit() {
    this.submitted = true;
    if (!this.blockForm.valid) {
      return false;
    } else {

      if (this.id == "")
      {
        this.apiService.createBlock(this.blockForm.value).subscribe(
          (res) => {
            console.log(this.blockForm.value)
            console.log('Block successfully created!')
            this.ngZone.run(() => this.router.navigateByUrl('/blocks-list'))
          }, (error) => {
            console.log(error);
          });
      }
      else
      {
        this.apiService.updateBlock(this.id,this.blockForm.value).subscribe(
          (res) => {
            console.log(res)
            this.ngZone.run(() => this.router.navigateByUrl('/blocks-list'))
          }, (error) => {
            console.log(error);
          });
      }
    }
  }


  

}

