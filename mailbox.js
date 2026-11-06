// Shared Library links use the same categories and anchors as the command reference.
(() => {
  const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const nav = document.getElementById('filters');
  const select = document.getElementById('toolCategory');
  for (const category of ['all', ...Object.keys(commands)]) {
    const label = category === 'all' ? 'All commands' : category;
    const href = 'index.html' + (category === 'all' ? '' : '#category-' + slug(category));
    const link = document.createElement('a');
    link.textContent = label; link.href = href; nav.append(link);
    const option = document.createElement('option');
    option.textContent = label; option.value = href; select.append(option);
  }
  const option = document.createElement('option');
  option.textContent = 'Shared mailbox'; option.value = 'shared-mailbox-automapping.html'; option.selected = true; select.append(option);
  select.addEventListener('change', () => { location.href = select.value; });
  document.getElementById('catalogSummary').textContent = Object.values(commands).flat().length + ' commands · ' + Object.keys(commands).length + ' categories';
})();

(() => {
      'use strict';
      const $ = id => document.getElementById(id);
      const mailboxInput = $('mailbox');
      const delegateInput = $('delegate');
      const connectCode = `# If the module is missing, install it once in this PowerShell session:\n# Install-Module -Name ExchangeOnlineManagement -Scope CurrentUser\nImport-Module ExchangeOnlineManagement -ErrorAction Stop\nConnect-ExchangeOnline -ErrorAction Stop`;
      $('connect-code').textContent = connectCode;
      let changeCode = '';
      let statusTimer;

      function validEmail(value) {
        if (value.length > 254 || !/^[A-Za-z0-9._%+'-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) return false;
        const [local, domain] = value.split('@');
        return local.length <= 64 && !local.startsWith('.') && !local.endsWith('.') && !local.includes('..') && domain.length <= 253 && domain.split('.').every(label => label.length <= 63 && /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label));
      }
      function psQuote(value) { return "'" + value.replaceAll("'", "''") + "'"; }
      function setHint(input, hintId, value) {
        const hint = $(hintId);
        const invalid = value !== '' && !validEmail(value);
        input.setAttribute('aria-invalid', String(invalid));
        hint.classList.toggle('error', invalid);
        hint.textContent = invalid ? 'Enter a valid email address, such as alex@contoso.com.' : input === mailboxInput ? 'Enter the shared mailbox’s SMTP address.' : 'Enter the individual user receiving FullAccess.';
      }
      function buildChange(mailbox, delegate, auto) {
        const autoLiteral = auto ? '$true' : '$false';
        return `# Run after connecting to Exchange Online. Review the targets and confirm at the prompt.\n& {\n    $mailbox = ${psQuote(mailbox)}\n    $delegate = ${psQuote(delegate)}\n    $autoMapping = ${autoLiteral}\n\n    try {\n        $target = Get-EXOMailbox -Identity $mailbox -ErrorAction Stop\n        if ($null -eq $target -or $target.RecipientTypeDetails -ne 'SharedMailbox') {\n            throw 'The target did not resolve to one shared mailbox.'\n        }\n        $principal = Get-EXORecipient -Identity $delegate -ErrorAction Stop\n        if ($null -eq $principal -or $principal.RecipientTypeDetails -notin @('UserMailbox', 'MailUser')) {\n            throw 'The delegate must resolve to an individual mailbox user or mail user.'\n        }\n        $mailboxId = $target.PrimarySmtpAddress.ToString()\n        $entries = @(Get-MailboxPermission -Identity $mailboxId -User $delegate -ErrorAction Stop)\n        $directDeny = @($entries | Where-Object {\n            -not $_.IsInherited -and $_.Deny -and $_.AccessRights -contains 'FullAccess'\n        })\n        if ($directDeny.Count -gt 0) { throw 'A direct FullAccess deny exists; review it manually.' }\n        $existing = @($entries | Where-Object {\n            -not $_.IsInherited -and -not $_.Deny -and $_.AccessRights -contains 'FullAccess'\n        })\n    } catch {\n        Write-Error "Preflight failed; no changes made: $($_.Exception.Message)"\n        return\n    }\n\n    Write-Host "Shared mailbox: $mailboxId"\n    Write-Host "Delegate: $($principal.PrimarySmtpAddress)"\n    Write-Host "Direct FullAccess grant found: $($existing.Count -gt 0)"\n    Write-Host "Requested automapping: $autoMapping"\n    Write-Warning 'Removing an existing grant briefly interrupts access. Outlook changes may take time to appear.'\n    $answer = Read-Host 'Type Y to apply this change'\n    if ($answer -cne 'Y') { Write-Host 'Cancelled; no changes made.'; return }\n\n    $removed = $false\n    try {\n        if ($existing.Count -gt 0) {\n            Remove-MailboxPermission -Identity $mailboxId -User $delegate -AccessRights FullAccess -InheritanceType All -Confirm:$false -ErrorAction Stop\n            $removed = $true\n        }\n        Add-MailboxPermission -Identity $mailboxId -User $delegate -AccessRights FullAccess -InheritanceType All -AutoMapping:${autoLiteral} -Confirm:$false -ErrorAction Stop | Out-Null\n    } catch {\n        Write-Error "Permission change failed: $($_.Exception.Message)"\n        if ($removed) { Write-Warning 'The direct FullAccess grant may now be absent. Restore it manually before leaving this task.' }\n        return\n    }\n\n    try {\n        $verified = @(Get-MailboxPermission -Identity $mailboxId -User $delegate -ErrorAction Stop | Where-Object {\n            -not $_.IsInherited -and -not $_.Deny -and $_.AccessRights -contains 'FullAccess'\n        })\n        if ($verified.Count -eq 0) { throw 'No direct allowed FullAccess grant was returned.' }\n        Write-Host 'Verified: direct allowed FullAccess is present.' -ForegroundColor Green\n        Write-Host 'The permission output does not show AutoMapping. Confirm Outlook behavior after propagation.'\n    } catch {\n        Write-Warning "The change ran, but verification did not confirm FullAccess: $($_.Exception.Message)"\n    }\n}`;
      }
      function update() {
        const mailbox = mailboxInput.value.trim();
        const delegate = delegateInput.value.trim();
        const auto = document.querySelector('input[name="automapping"]:checked').value === 'true';
        setHint(mailboxInput, 'mailbox-hint', mailbox);
        setHint(delegateInput, 'delegate-hint', delegate);
        $('summary-mailbox').textContent = mailbox || 'Waiting for address';
        $('summary-delegate').textContent = delegate || 'Waiting for address';
        $('summary-action').textContent = 'Set automapping ' + (auto ? 'on' : 'off');
        $('choice-note').textContent = auto ? 'On allows Outlook to add this mailbox to the delegate’s profile automatically.' : 'Off keeps the mailbox out of automatic Outlook profile loading.';
        const ready = validEmail(mailbox) && validEmail(delegate) && mailbox.toLowerCase() !== delegate.toLowerCase();
        if (mailbox && delegate && mailbox.toLowerCase() === delegate.toLowerCase()) {
          $('delegate-hint').textContent = 'The delegate must be different from the shared mailbox.';
          $('delegate-hint').classList.add('error');
          delegateInput.setAttribute('aria-invalid', 'true');
        }
        changeCode = ready ? buildChange(mailbox, delegate, auto) : '';
        $('change-code').textContent = changeCode || 'Enter valid, different mailbox and delegate emails to generate the script.';
        $('change-code').classList.toggle('empty', !ready);
        $('copy-change').disabled = !ready;
        $('copy-all').disabled = !ready;
      }
      function announce(message) {
        const status = $('copy-status');
        status.textContent = message;
        status.classList.add('show');
        clearTimeout(statusTimer);
        statusTimer = setTimeout(() => status.classList.remove('show'), 3300);
      }
      async function copy(text, label) {
        try {
          if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
          else {
            const box = document.createElement('textarea');
            box.value = text;
            box.style.position = 'fixed';
            box.style.opacity = '0';
            document.body.appendChild(box);
            try {
              box.select();
              if (!document.execCommand('copy')) throw new Error('Clipboard unavailable');
            } finally { box.remove(); }
          }
          announce(label + ' copied to clipboard.');
        } catch {
          announce('Copy was blocked. Select the script text and copy it manually.');
        }
      }
      mailboxInput.addEventListener('input', update);
      delegateInput.addEventListener('input', update);
      document.querySelectorAll('input[name="automapping"]').forEach(input => input.addEventListener('change', update));
      $('copy-connect').addEventListener('click', () => copy(connectCode, 'Connection script'));
      $('copy-change').addEventListener('click', () => changeCode && copy(changeCode, 'Change script'));
      $('copy-all').addEventListener('click', () => changeCode && copy(connectCode + '\n\n' + changeCode, 'Entire script'));
      update();
    })();
