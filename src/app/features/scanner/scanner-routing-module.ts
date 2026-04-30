import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScannerList } from './pages/scanner-list/scanner-list';
import { ScannerConfiguration } from './pages/scanner-configuration/scanner-configuration';
import { ScannerListArchives } from './pages/scanner-list-archives/scanner-list-archives';
import { editorGuard } from '../../core/guards/editor.guard';

const routes: Routes = [
  { path: '', component: ScannerList },
  { path: 'archivados', component: ScannerListArchives },
  { path: 'nuevo', component: ScannerConfiguration, canActivate: [editorGuard] },
  { path: 'configuracion/:id', component: ScannerConfiguration, canActivate: [editorGuard] }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScannerRoutingModule { }
