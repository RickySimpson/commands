const commands = {
            'PowerShell': [
                {
                    name: 'Reestablish domain trust',
                    command: 'Test-ComputerSecureChannel -Repair -Credential (Get-Credential)',
                    description: 'Repair broken trust relationship between computer and domain'
                },
                {
                    name: 'Get installed printers',
                    command: 'Get-Printer | Format-List Name',
                    description: 'List all installed printers with detailed formatting'
                },
                {
                    name: 'Rename printer',
                    command: 'Rename-Printer -Name "Current Printer Name" -NewName "New Printer Name"',
                    description: 'Change the display name of an installed printer'
                },
                {
                    name: 'Get running services',
                    command: 'Get-Service | Where-Object {$_.Status -eq "Running"} | Sort-Object DisplayName',
                    description: 'List all active Windows services alphabetically'
                },
                {
                    name: 'Restart a service',
                    command: 'Restart-Service -Name "ServiceName" -Force',
                    description: 'PowerShell: Force restart a Windows service'
                },
                {
                    name: 'Check network adapter info',
                    command: 'ipconfig /all',
                    description: 'Display detailed network configuration for all adapters'
                },
                {
                    name: 'Flush DNS cache',
                    command: 'ipconfig /flushdns',
                    description: 'Clear DNS resolver cache to fix connectivity issues'
                },
                {
                    name: 'Test network connectivity',
                    command: 'Test-NetConnection -ComputerName google.com -Port 443',
                    description: 'PowerShell: Check if specific port is reachable on remote host'
                },
                {
                    name: 'View event logs (errors)',
                    command: 'Get-EventLog -LogName System -EntryType Error -Newest 50',
                    description: 'PowerShell: Show 50 most recent system errors'
                },
                {
                    name: 'Check Windows Update status',
                    command: 'Get-WindowsUpdate',
                    description: 'PowerShell: List available Windows updates (requires PSWindowsUpdate module)'
                }
            ],
            'Command Prompt': [
                {
                    name: 'Open User Profiles GUI',
                    command: 'SystemPropertiesAdvanced.exe',
                    description: 'Launch System Properties > Advanced tab for user profile management'
                },
                {
                    name: 'Open Device Manager',
                    command: 'devmgmt.msc',
                    description: 'Launch Device Manager to manage hardware devices'
                },
                {
                    name: 'Install printer (admin wizard)',
                    command: 'rundll32 printui.dll,PrintUIEntry /il',
                    description: 'Opens the Add Printer wizard with administrator privileges'
                },
                {
                    name: 'Check power options',
                    command: 'powercfg /a',
                    description: 'Display available sleep states and power options'
                },
                {
                    name: 'Disable hibernation',
                    command: 'powercfg /hibernate off',
                    description: 'Turn off hibernation and delete hiberfil.sys to free disk space'
                },
                {
                    name: 'Network adapter info',
                    command: 'ipconfig /all | more',
                    description: 'Display detailed network configuration for all adapters'
                },
                {
                    name: 'Flush DNS cache',
                    command: 'ipconfig /flushdns',
                    description: 'Clear DNS resolver cache to fix connectivity issues'
                },
                {
                    name: 'Renew IP address',
                    command: 'ipconfig /release && ipconfig /renew',
                    description: 'Release and obtain new IP address from DHCP'
                },
                {
                    name: 'Test connectivity',
                    command: 'ping google.com -t',
                    description: 'Continuous ping to test network stability (Ctrl+C to stop)'
                },
                {
                    name: 'Trace network route',
                    command: 'tracert google.com',
                    description: 'Show path packets take to reach destination'
                },
                {
                    name: 'View network connections',
                    command: 'netstat -ano | findstr ESTABLISHED',
                    description: 'Show active network connections with process IDs'
                },
            ],
            'Windows Repair': [
                {
                    name: '1️⃣ Initial SFC Scan',
                    command: 'sfc /scannow',
                    description: 'First pass: Scan and repair corrupted system files'
                },
                {
                    name: '2️⃣ DISM Check Health',
                    command: 'Dism.exe /online /Cleanup-Image /checkhealth',
                    description: 'Quick check if component store has corruption'
                },
                {
                    name: '3️⃣ DISM Scan Health',
                    command: 'Dism.exe /online /Cleanup-Image /scanhealth',
                    description: 'Detailed scan for component store issues'
                },
                {
                    name: '4️⃣ DISM Restore Health',
                    command: 'Dism.exe /online /Cleanup-Image /Restorehealth',
                    description: 'Repair component store using Windows Update'
                },
                {
                    name: '5️⃣ Verify SFC Scan',
                    command: 'sfc /scannow',
                    description: 'Verify all system files are now healthy'
                },
                {
                    name: '6️⃣ Analyze Component Store',
                    command: 'Dism.exe /Online /Cleanup-Image /AnalyzeComponentStore',
                    description: 'Check if component cleanup is recommended'
                },
                {
                    name: '7️⃣ Component Cleanup',
                    command: 'Dism.exe /Online /Cleanup-Image /StartComponentCleanup',
                    description: 'Remove old components to free disk space'
                }
            ],
            'Windows Update': [
                {
                    name: '1️⃣ Install NuGet Provider',
                    command: 'Install-PackageProvider -Name NuGet -Force',
                    description: 'Install NuGet package provider (required for PSWindowsUpdate module)'
                },
                {
                    name: '2️⃣ Install PSWindowsUpdate Module',
                    command: 'Install-Module -Name PSWindowsUpdate -Force',
                    description: 'Download and install the Windows Update PowerShell module'
                },
                {
                    name: '3️⃣ Import Module',
                    command: 'Import-Module PSWindowsUpdate',
                    description: 'Load the PSWindowsUpdate module into current session'
                },
                {
                    name: '4️⃣ Check Available Updates',
                    command: 'Get-WindowsUpdate',
                    description: 'List all available Windows updates without installing'
                },
                {
                    name: '5️⃣ Install Updates (No Reboot)',
                    command: 'Get-WindowsUpdate -AcceptAll -Install -IgnoreReboot',
                    description: 'Install all updates but skip automatic reboot'
                },
                {
                    name: '6️⃣ Install Updates (Auto Reboot)',
                    command: 'Get-WindowsUpdate -AcceptAll -Install -AutoReboot',
                    description: 'Install all updates and reboot automatically if needed'
                },
                {
                    name: 'View Update History',
                    command: 'Get-WUHistory -Last 20',
                    description: 'Show the last 20 installed Windows updates'
                },
               
                {
                    name: '⚙️ Bypass Execution Policy',
                    command: 'Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process -Force',
                    description: 'Temporarily allow script execution for current PowerShell session only'
                }
            ],

            'Winget': [
                {
                    name: 'Install winget',
                    command: 'Add-AppxPackage -Path "https://aka.ms/getwinget"',
                    description: 'Install App Installer / winget so the PC can use winget commands'
                },
                {
                    name: 'Install winget source package',
                    command: 'Add-AppxPackage -Path "https://cdn.winget.microsoft.com/cache/source2.msix"',
                    description: 'PowerShell: Install the Windows Package Manager source package from the winget CDN'
                },
                {
                    name: 'Install Adobe Acrobat Reader',
                    command: 'winget install --id Adobe.Acrobat.Reader.64-bit -e',
                    description: 'Install Adobe Acrobat Reader 64-bit'
                },
                {
                    name: 'Install Zoom',
                    command: 'winget install --id Zoom.Zoom -e',
                    description: 'Install Zoom desktop client'
                },
                {
                    name: 'Install 7-Zip',
                    command: 'winget install --id 7zip.7zip -e',
                    description: 'Install 7-Zip file archiver'
                },
                {
                    name: 'Install Google Chrome',
                    command: 'winget install --id Google.Chrome -e',
                    description: 'Install Google Chrome browser'
                },
                {
                    name: 'Install Dell Command | Update',
                    command: 'winget install --id Dell.CommandUpdate.Universal -e',
                    description: 'Install Dell Command | Update for driver and BIOS updates'
                },
                {
                    name: 'Install .NET Runtime 8',
                    command: 'winget install --id Microsoft.DotNet.Runtime.8 -e',
                    description: 'Install Microsoft .NET 8 desktop/runtime components'
                },
                {
                    name: 'Install Microsoft Teams',
                    command: 'winget install --id Microsoft.Teams -e',
                    description: 'Install Microsoft Teams'
                },
                {
                    name: 'Install VLC Media Player',
                    command: 'winget install --id VideoLAN.VLC -e',
                    description: 'Install VLC media player'
                },
                {
                    name: 'Install Notepad++',
                    command: 'winget install --id Notepad++.Notepad++ -e',
                    description: 'Install Notepad++ text editor'
                },
                {
                    name: 'Install Visual Studio Code',
                    command: 'winget install --id Microsoft.VisualStudioCode -e',
                    description: 'Install Visual Studio Code'
                },
                {
                    name: 'Install PuTTY',
                    command: 'winget install --id PuTTY.PuTTY -e',
                    description: 'Install PuTTY SSH and terminal client'
                },
                {
                    name: 'Install FileZilla',
                    command: 'winget install --id TimKosse.FileZilla.Client -e',
                    description: 'Install FileZilla FTP client'
                },
                {
                    name: 'Install WatchGuard VPN',
                    command: 'winget install --id WatchGuard.MobileVPNWithSSLClient -e',
                    description: 'Install WatchGuard Mobile VPN'
                },
                {
                    name: 'Install SonicWall NetExtender VPN',
                    command: 'winget install --id SonicWall.NetExtender -e',
                    description: 'Install SonicWall NetExtender VPN client'
                }
            ],
            'Microsoft 365': [
                {
                    name: 'Connect to Exchange Online',
                    command: 'Connect-ExchangeOnline -UserPrincipalName admin@domain.com',
                    description: 'Authenticate to Exchange Online PowerShell management'
                },
                {
                    name: 'Grant calendar permissions',
                    command: 'Add-MailboxFolderPermission -Identity "User1@domain.com:\\Calendar" -User "User2@domain.com" -AccessRights Reviewer',
                    description: 'Give User2 access to User1\'s calendar. Other common AccessRights: Owner, PublishingEditor, Editor, PublishingAuthor, Author, NonEditingAuthor, Reviewer, Contributor, AvailabilityOnly, LimitedDetails'
                },
                {
                    name: 'Import AD Sync module',
                    command: 'Import-Module ADSync',
                    description: 'Load Azure AD Connect synchronization module'
                },
                {
                    name: 'Run Delta Sync',
                    command: 'Start-ADSyncSyncCycle -PolicyType Delta',
                    description: 'Sync only changes from on-prem AD to Azure AD (faster than full sync)'
                },
                {
                    name: 'Fix uppercase SMTP address',
                    command: 'Set-Mailbox flast@domain.com -EmailAddresses @{add="SMTP:flast@domain.com"; remove="SMTP:FLast@domain.com"}',
                    description: 'Correct improperly capitalized primary SMTP address (uppercase SMTP = primary)'
                },
                {
                    name: 'Verify email addresses',
                    command: 'Get-Mailbox user@domain.com | Select PrimarySmtpAddress,EmailAddresses',
                    description: 'Display all email addresses associated with a mailbox'
                },
                {
                    name: 'List all mailboxes',
                    command: 'Get-Mailbox -ResultSize Unlimited | Select DisplayName,PrimarySmtpAddress',
                    description: 'Show all user mailboxes with email addresses'
                },
                {
                    name: 'Check mailbox size',
                    command: 'Get-MailboxStatistics -Identity user@domain.com | Select DisplayName,TotalItemSize',
                    description: 'View total mailbox storage usage for specific user'
                },
                {
                    name: 'Add mailbox permissions',
                    command: 'Add-MailboxPermission -Identity shared@domain.com -User user@domain.com -AccessRights FullAccess',
                    description: 'Grant full access to shared mailbox'
                },
                {
                    name: 'List distribution groups',
                    command: 'Get-DistributionGroup | Select DisplayName,PrimarySmtpAddress',
                    description: 'Show all distribution groups and their email addresses'
                },
                {
                    name: 'List all Teams',
                    command: 'Get-Team | Select DisplayName,GroupId,Visibility',
                    description: 'Show all Microsoft Teams with IDs and privacy settings'
                },
                {
                    name: 'Add user to Team',
                    command: 'Add-TeamUser -GroupId <TeamID> -User user@domain.com -Role Member',
                    description: 'Add member to existing Microsoft Team'
                },
                {
                    name: 'Check user licenses',
                    command: 'Connect-MgGraph -Scopes "LicenseAssignment.Read.All"\nGet-MgUserLicenseDetail -UserId "user@domain.com" | Select SkuPartNumber,SkuId',
                    description: 'View assigned licenses. Requires Microsoft.Graph.Authentication and Microsoft.Graph.Users, plus an appropriate directory role.',
                    docs: 'https://learn.microsoft.com/en-us/powershell/module/microsoft.graph.users/get-mguserlicensedetail',
                    reviewed: '2026-10-15'
                },
                {
                    name: 'Reset user password',
                    command: 'Connect-MgGraph -Scopes "User-PasswordProfile.ReadWrite.All"\n$password = Read-Host "Enter a unique temporary password" -AsSecureString\n$credential = [pscredential]::new("unused", $password)\nUpdate-MgUser -UserId "user@domain.com" -PasswordProfile @{Password = $credential.GetNetworkCredential().Password; ForceChangePasswordNextSignIn = $true}\nRemove-Variable password, credential',
                    description: 'Reset a cloud user password and require a change at next sign-in. Requires Microsoft.Graph.Authentication, Microsoft.Graph.Users, consent and a supported password-reset administrator role. Edit the user address first.',
                    docs: 'https://learn.microsoft.com/en-us/graph/api/user-update',
                    reviewed: '2026-10-15'
                }
            ]

        };
